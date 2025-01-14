// Globales Array für alle geladenen Pokémon
let loadedPokemon = [];
let currentPokemonIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  const contentDiv = document.getElementById("content");
  const loadMoreButton = document.getElementById("load-more");
  const loadingScreen = document.getElementById("loading-screen");
  const inputField = document.querySelector(".header-input input");
  const hintMessage = document.createElement("div");
  const overlay = document.getElementById("pokemon-overlay");
  const overlayImage = document.getElementById("overlay-image");
  const overlayName = document.getElementById("overlay-name");
  const overlayDetails = document.getElementById("overlay-details");
  const closeOverlayButton = document.getElementById("close-overlay");
  const emptyResultsMessage = document.createElement("div");

  // Nachdem die DOM-Inhalte geladen sind, fügen wir Event-Listener für die Buttons hinzu
  document
    .getElementById("previous-button")
    .addEventListener("click", previousPokemonDetails);
  document
    .getElementById("next-button")
    .addEventListener("click", nextPokemonDetails);

  let allPokemon = [];
  let displayedPokemonNames = new Set();
  let offset = 0;
  const limit = 25;
  let isSearching = false;
  let allPokemonLoaded = false;

  initializeHintMessage();
  initializeEmptyResultsMessage();

  function initializeHintMessage() {
    hintMessage.classList.add("hint-message");
    inputField.parentElement.appendChild(hintMessage);
  }

  function initializeEmptyResultsMessage() {
    emptyResultsMessage.classList.add("hint-message");
    emptyResultsMessage.textContent =
      "Keine Pokémon gefunden. Bitte versuche es mit einem anderen Namen.";
    emptyResultsMessage.style.display = "none";
    contentDiv.appendChild(emptyResultsMessage);
  }

  function showLoading() {
    loadingScreen.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function hideLoading() {
    setTimeout(() => {
      loadingScreen.style.display = "none";
      document.body.style.overflow = "auto";
    }, 1000);
  }

  async function fetchPokemon(offset, limit) {
    const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    return await response.json();
  }

  async function loadAllPokemon() {
    if (allPokemonLoaded) return;

    const data = await fetchPokemon(0, 1000);
    allPokemon.push(...data.results);
    allPokemonLoaded = true;
  }

  async function renderPokemonCards(pokemonList) {
    for (const pokemon of pokemonList) {
      if (!displayedPokemonNames.has(pokemon.name)) {
        const pokemonDetails = await fetchPokemonDetails(pokemon.url);
        createPokemonCard(pokemonDetails);
      }
    }
  }

  async function fetchPokemonDetails(url) {
    const response = await fetch(url);
    return await response.json();
  }

  function createPokemonCard(pokemonDetails) {
    const pokemonCard = document.createElement("div");
    pokemonCard.classList.add("pokemon-card");
    pokemonCard.innerHTML = ` 
      <div class="pokemon-number">#${pokemonDetails.id
        .toString()
        .padStart(3, "0")}</div>
      <img src="${
        pokemonDetails.sprites.other["official-artwork"].front_default
      }" alt="${pokemonDetails.name}" />
      <h2>${capitalizeFirstLetter(pokemonDetails.name)}</h2>
    `;
    pokemonCard.addEventListener("click", () => showOverlay(pokemonDetails));
    contentDiv.appendChild(pokemonCard);
    displayedPokemonNames.add(pokemonDetails.name);

    // Füge das geladene Pokémon zum globalen Array hinzu
    addLoadedPokemon(pokemonDetails);
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  async function renderPokemon(pokemonList, isSearch = false) {
    if (isSearch) displayedPokemonNames.clear();
    toggleEmptyResultsMessage(pokemonList.length === 0);
    await renderPokemonCards(pokemonList);
  }

  function toggleEmptyResultsMessage(isEmpty) {
    emptyResultsMessage.style.display = isEmpty ? "block" : "none";
  }

  async function loadPokemon(offset, filter = "") {
    try {
      showLoading();
      const pokemonList = filter
        ? await filterPokemon(filter)
        : await fetchPaginatedPokemon(offset);
      if (!filter) {
        await renderPokemonCards(pokemonList);
      } else {
        contentDiv.innerHTML = "";
        await renderPokemon(pokemonList, Boolean(filter));
      }
    } finally {
      hideLoading();
    }
  }

  async function filterPokemon(filter) {
    await loadAllPokemon();
    return allPokemon.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(filter.toLowerCase())
    );
  }

  async function fetchPaginatedPokemon(offset) {
    const data = await fetchPokemon(offset, limit);
    if (!isSearching) allPokemon.push(...data.results);
    return data.results;
  }

  function showOverlay(pokemon) {
    currentPokemonIndex = loadedPokemon.findIndex((p) => p.id === pokemon.id);
    overlay.style.display = "flex";
    overlayImage.src = pokemon.sprites.other["official-artwork"].front_default;
    overlayName.textContent = capitalizeFirstLetter(pokemon.name);
    renderOverlayTabs(pokemon);

    // Buttons ein-/ausblenden, aber die Buttons bleiben immer sichtbar
    document.getElementById("previous-button").style.display = "inline-block";
    document.getElementById("next-button").style.display = "inline-block";
  }

  function nextPokemonDetails() {
    if (currentPokemonIndex < loadedPokemon.length - 1) {
      currentPokemonIndex++;
    } else {
      // Schleife zum ersten Pokémon
      currentPokemonIndex = 0;
    }
    showOverlay(loadedPokemon[currentPokemonIndex]);
  }

  function previousPokemonDetails() {
    if (currentPokemonIndex > 0) {
      currentPokemonIndex--;
    } else {
      // Schleife zum letzten Pokémon
      currentPokemonIndex = loadedPokemon.length - 1;
    }
    showOverlay(loadedPokemon[currentPokemonIndex]);
  }

  function renderOverlayTabs(pokemon) {
    const tabs = `
      <div class="overlay-tabs">
        <button class="tab-button active" data-tab="about">About</button>
        <button class="tab-button" data-tab="stats">Stats</button>
        <button class="tab-button" data-tab="evolution">Evolution</button>
      </div>
      <div class="tab-content about">${renderAboutContent(pokemon)}</div>
      <div class="tab-content stats hidden">${renderStatsContent(pokemon)}</div>
      <div class="tab-content evolution hidden">Loading Evolution...</div>
    `;
    overlayDetails.innerHTML = tabs;
    attachTabEventListeners(pokemon);
    loadEvolutionContent(pokemon);
  }

  function renderAboutContent(pokemon) {
    const height = pokemon.height * 10;
    const weight = pokemon.weight / 10;
    const abilities = pokemon.abilities
      .map((a) => capitalizeFirstLetter(a.ability.name))
      .join(", ");
    return `<div class="about-content">
                <div class="about-content-rows">
                    <p>Height:</p><p> ${height} cm</p>
                </div>
                <div class="about-content-rows">
                    <p>Weight:</p><p> ${weight} kg</p>
                </div>
                <div class="about-content-rows">
                    <p>Abilities:</p><p> ${abilities}</p>
                </div>
            </div>`;
  }

  function renderStatsContent(pokemon) {
    return pokemon.stats
      .map((stat) => {
        const name = capitalizeFirstLetter(stat.stat.name);
        const value = stat.base_stat;
        const maxValue = Math.max(100, value);
        return `
        <div class="progressbar-container">
          <p>${name}:</p>
          <progress class="progressbar" max="${maxValue}" value="${value}"></progress>
          <span class="progress-value">${value}</span>
        </div>
      `;
      })
      .join("");
  }

  async function loadEvolutionContent(pokemon) {
    const speciesUrl = pokemon.species.url;
    const speciesData = await fetchData(speciesUrl);
    const evolutionChainUrl = speciesData.evolution_chain.url;
    const evolutionData = await fetchData(evolutionChainUrl);
    const evolutionHtml = buildEvolutionChain(evolutionData.chain);
    document.querySelector(".tab-content.evolution").innerHTML = evolutionHtml;
  }

  async function fetchData(url) {
    const response = await fetch(url);
    return await response.json();
  }

  function buildEvolutionChain(chain) {
    const stages = [];
    let current = chain;
    while (current) {
      const name = capitalizeFirstLetter(current.species.name);
      const id = extractIdFromUrl(current.species.url);
      const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
      stages.push(`
        <div class="evolution-stage">
          <img src="${imgUrl}" alt="${name}" />
          <p>${name}</p>
        </div>
      `);
      current = current.evolves_to[0];
    }
    return `<div class="evolution-chain">${stages.join("")}</div>`;
  }

  function extractIdFromUrl(url) {
    const match = url.match(/pokemon-species\/(\d+)\//); // Regex angepasst
    return match ? match[1] : null;
  }

  function attachTabEventListeners() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const tab = event.target.dataset.tab;
        document
          .querySelectorAll(".tab-button")
          .forEach((btn) => btn.classList.remove("active"));
        document
          .querySelectorAll(".tab-content")
          .forEach((content) => content.classList.add("hidden"));
        event.target.classList.add("active");
        document
          .querySelector(`.tab-content.${tab}`)
          .classList.remove("hidden");
      });
    });
  }

  function closeOverlay() {
    overlay.style.display = "none";
  }

  inputField.addEventListener("input", async (event) => {
    const query = event.target.value.trim();
    if (query.length >= 3) {
      hintMessage.textContent = "";
      isSearching = true;
      await loadPokemon(0, query);
      loadMoreButton.style.display = "none";
    } else {
      resetSearch(query);
    }
  });

  function resetSearch(query) {
    hintMessage.textContent =
      query.length > 0 ? "Bitte mindestens 3 Zeichen eingeben." : "";
    isSearching = false;
    displayedPokemonNames.clear();
    contentDiv.innerHTML = "";
    offset = 0;
    loadPokemon(offset);
    loadMoreButton.style.display = "block";
  }

  loadMoreButton.addEventListener("click", () => {
    offset += limit;
    loadPokemon(offset);
  });

  closeOverlayButton.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlay();
  });

  loadPokemon(offset);
});

// Funktion, um ein neues Pokémon zum globalen Array hinzuzufügen
function addLoadedPokemon(pokemonDetails) {
  if (!loadedPokemon.some((p) => p.id === pokemonDetails.id)) {
    loadedPokemon.push(pokemonDetails);
  }
}

async function fetchSpecificPokemonDetails(pokemonIdentifier) {
  try {
    // API-URL für ein spezifisches Pokémon (Name oder ID)
    const url = `https://pokeapi.co/api/v2/pokemon/${pokemonIdentifier.toLowerCase()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Pokémon mit der ID oder dem Namen "${pokemonIdentifier}" wurde nicht gefunden.`
      );
    }

    const pokemonDetails = await response.json();
    return pokemonDetails;
  } catch (error) {
    return null;
  }
}
