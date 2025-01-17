let loadedPokemon = [];
let currentPokemonIndex = 0;

const typeColors = {
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  bug: "#A8B820",
  electric: "#F8D030",
  rock: "#B8A038",
  ground: "#E0C068",
  psychic: "#F85888",
  ice: "#98D8D8",
  dragon: "#7038F8",
  dark: "#705848",
  fairy: "#EE99AC",
  steel: "#B8B8D0",
  fighting: "#C03028",
  ghost: "#705898",
  normal: "#A8A878",
  poison: "#A040A0",
  flying: "#A890F0",
};

function initPage() {
  initEventListeners();
  initializeHintMessage();
  initializeEmptyResultsMessage();
  loadPokemon(offset);
}

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
let allPokemon = [];
let displayedPokemonNames = new Set();
let offset = 0,
  limit = 25,
  isSearching = false,
  allPokemonLoaded = false;

function initEventListeners() {
  document
    .getElementById("previous-button")
    .addEventListener("click", previousPokemonDetails);
  document
    .getElementById("next-button")
    .addEventListener("click", nextPokemonDetails);
  closeOverlayButton.addEventListener("click", closeOverlay);
  overlay.addEventListener(
    "click",
    (e) => e.target === overlay && closeOverlay()
  );
  inputField.addEventListener("input", handleSearchInput);
  loadMoreButton.addEventListener("click", () => {
    offset += limit;
    loadPokemon(offset);
  });
}

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
  const pokemonCard = createCardElement(pokemonDetails);
  setCardStyle(pokemonCard, pokemonDetails);
  populateCardContent(pokemonCard, pokemonDetails);
  setupCardClickListener(pokemonCard, pokemonDetails);
  finalizeCard(pokemonCard, pokemonDetails);
}

function createCardElement(pokemonDetails) {
  const card = document.createElement("div");
  card.classList.add("pokemon-card");
  return card;
}

function setCardStyle(card, pokemonDetails) {
  const primaryType = pokemonDetails.types[0].type.name;
  card.style.backgroundColor = typeColors[primaryType] || "#f0f0f0";
}

function populateCardContent(card, pokemonDetails) {
  const types = pokemonDetails.types.map((type) => capitalize(type.type.name));
  card.innerHTML = `
      <div class="pokemon-number">#${pokemonDetails.id
        .toString()
        .padStart(3, "0")}</div>
      <img src="${
        pokemonDetails.sprites.other["official-artwork"].front_default
      }" alt="${pokemonDetails.name}" />
      <h2>${capitalize(pokemonDetails.name)}</h2>
      <p class="pokemon-types">${types.join(", ")}</p>`;
}

function setupCardClickListener(card, pokemonDetails) {
  card.addEventListener("click", () => showOverlay(pokemonDetails));
}

function finalizeCard(card, pokemonDetails) {
  contentDiv.appendChild(card);
  displayedPokemonNames.add(pokemonDetails.name);
  addLoadedPokemon(pokemonDetails);
}

function capitalize(string) {
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
    if (filter) {
      contentDiv.innerHTML = "";
      await renderPokemon(pokemonList, Boolean(filter));
    } else {
      await renderPokemonCards(pokemonList);
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
  overlayName.textContent = capitalize(pokemon.name);
  renderOverlayTabs(pokemon);
}

function nextPokemonDetails() {
  currentPokemonIndex = (currentPokemonIndex + 1) % loadedPokemon.length;
  showOverlay(loadedPokemon[currentPokemonIndex]);
}

function previousPokemonDetails() {
  currentPokemonIndex =
    (currentPokemonIndex - 1 + loadedPokemon.length) % loadedPokemon.length;
  showOverlay(loadedPokemon[currentPokemonIndex]);
}

function renderOverlayTabs(pokemon) {
  overlayDetails.innerHTML = `
      <div class="overlay-tabs">
        <button class="tab-button active" data-tab="about">About</button>
        <button class="tab-button" data-tab="stats">Stats</button>
        <button class="tab-button" data-tab="evolution">Evolution</button>
      </div>
      <div class="tab-content about">${renderAboutContent(pokemon)}</div>
      <div class="tab-content stats hidden">${renderStatsContent(pokemon)}</div>
      <div class="tab-content evolution hidden">Loading Evolution...</div>
    `;
  attachTabEventListeners();
  loadEvolutionContent(pokemon);
}

function renderAboutContent(pokemon) {
  const types = pokemon.types
    .map((type) => capitalize(type.type.name))
    .join(", ");
  const height = pokemon.height * 10,
    weight = pokemon.weight / 10;
  const abilities = pokemon.abilities
    .map((a) => capitalize(a.ability.name))
    .join(", ");
  return `
      <div class="about-content">
        <div class="about-content-rows"><p>Type:</p><p>${types}</p></div>
        <div class="about-content-rows"><p>Height:</p><p>${height} cm</p></div>
        <div class="about-content-rows"><p>Weight:</p><p>${weight} kg</p></div>
        <div class="about-content-rows"><p>Abilities:</p><p>${abilities}</p></div>
      </div>`;
}

function renderStatsContent(pokemon) {
  return pokemon.stats
    .map((stat) => {
      const name = capitalize(stat.stat.name),
        value = stat.base_stat;
      return `
          <div class="progressbar-container">
            <p>${name}:</p>
            <progress class="progressbar" max="100" value="${value}"></progress>
            <span class="progress-value">${value}</span>
          </div>`;
    })
    .join("");
}

async function loadEvolutionContent(pokemon) {
  const speciesData = await fetchData(pokemon.species.url);
  const evolutionData = await fetchData(speciesData.evolution_chain.url);
  const evolutionHtml = buildEvolutionChain(evolutionData.chain);
  document.querySelector(".tab-content.evolution").innerHTML = evolutionHtml;
}

async function fetchData(url) {
  const response = await fetch(url);
  return await response.json();
}

function buildEvolutionChain(chain) {
  const stages = [];
  while (chain) {
    const name = capitalize(chain.species.name);
    const id = extractIdFromUrl(chain.species.url);
    stages.push(`
        <div class="evolution-stage">
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" alt="${name}" />
          <p>${name}</p>
        </div>`);
    chain = chain.evolves_to[0];
  }
  return `<div class="evolution-chain">${stages.join("")}</div>`;
}

function extractIdFromUrl(url) {
  const match = url.match(/pokemon-species\/(\d+)\//);
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
      document.querySelector(`.tab-content.${tab}`).classList.remove("hidden");
    });
  });
}

function closeOverlay() {
  overlay.style.display = "none";
}

function handleSearchInput(event) {
  const query = event.target.value.trim();

  if (query.length >= 3) {
    hintMessage.textContent = "";
    isSearching = true;
    loadPokemon(offset, query);
    loadMoreButton.style.display = "none";
  } else {
    resetSearch(query);
  }
}

function resetSearch(query) {
  hintMessage.textContent =
    query.length > 0 ? "Bitte mindestens 3 Zeichen eingeben." : "";
  isSearching = false;
  displayedPokemonNames.clear();
  contentDiv.innerHTML = "";
  loadMoreButton.style.display = "none";
  offset = 0;

  if (query.length === 0) {
    showLoadingAndReset();
    loadMoreButton.style.display = "block";
  }
}

function showLoadingAndReset() {
  showLoading();
  loadPokemon(0);
}

function addLoadedPokemon(pokemonDetails) {
  if (!loadedPokemon.some((p) => p.id === pokemonDetails.id))
    loadedPokemon.push(pokemonDetails);
}

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

function bottomFunction() {
  document.body.scrollTop = 100000000;
  document.documentElement.scrollTop = 100000000;
}
