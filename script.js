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

  let allPokemon = [];
  let displayedPokemonNames = new Set();
  let offset = 0;
  const limit = 15;
  let isSearching = false;
  let allPokemonLoaded = false;

  // Hinweis-Message für die Eingabefelder
  hintMessage.classList.add("hint-message");
  inputField.parentElement.appendChild(hintMessage);

  // Leere Suchergebnisse Message
  emptyResultsMessage.classList.add("hint-message");
  emptyResultsMessage.textContent = "Keine Pokémon gefunden. Bitte versuche es mit einem anderen Namen.";
  emptyResultsMessage.style.display = "none"; // Standardmäßig unsichtbar

  contentDiv.appendChild(emptyResultsMessage);

  // Funktionen für das Laden von Pokémon und die Anzeige des Ladebildschirms
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

  // Fetch-Funktion für Pokémon
  async function fetchPokemon(offset, limit) {
    const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    return await response.json();
  }

  // Lädt alle Pokémon-Daten (nur einmalig beim Start)
  async function loadAllPokemon() {
    if (allPokemonLoaded) return;

    const url = `https://pokeapi.co/api/v2/pokemon?limit=1000`;
    const response = await fetch(url);
    const data = await response.json();

    allPokemon.push(...data.results);
    allPokemonLoaded = true;
  }

  // Rendert die Pokémon-Karten und zeigt sie an
  async function renderPokemon(pokemonList, isSearch = false) {
    if (isSearch) {
      displayedPokemonNames.clear();
    }

    // Zeigt die leere Suchergebnismeldung an, wenn keine Pokémon gefunden werden
    if (pokemonList.length === 0) {
      emptyResultsMessage.style.display = "block";
    } else {
      emptyResultsMessage.style.display = "none"; // Ausblenden, wenn Ergebnisse da sind
    }

    // Pokémon-Daten rendern
    for (const pokemon of pokemonList) {
      if (!displayedPokemonNames.has(pokemon.name)) {
        const response = await fetch(pokemon.url);
        const pokemonDetails = await response.json();

        const pokemonCard = document.createElement("div");
        pokemonCard.classList.add("pokemon-card");

        const pokemonName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
        pokemonCard.innerHTML = `<img src="${pokemonDetails.sprites.other["official-artwork"].front_default}" alt="${pokemon.name}" />
        <h2>${pokemonName}</h2>`;

        // Klick-Listener für das Overlay
        pokemonCard.addEventListener("click", () => showOverlay(pokemonDetails));

        contentDiv.appendChild(pokemonCard);
        displayedPokemonNames.add(pokemon.name);
      }
    }
  }

  // Funktion, um Pokémon zu laden (unterstützt Filter)
  async function loadPokemon(offset, filter = "") {
    try {
      showLoading();

      if (filter) {
        await loadAllPokemon();

        const filteredPokemon = allPokemon.filter((pokemon) =>
          pokemon.name.toLowerCase().includes(filter.toLowerCase()) // Sucheinträge auch bei Teiltreffern
        );

        contentDiv.innerHTML = ""; // Vorhandene Pokémon löschen
        await renderPokemon(filteredPokemon, true);
      } else {
        const data = await fetchPokemon(offset, limit);

        if (!isSearching) {
          allPokemon.push(...data.results);
        }

        await renderPokemon(data.results);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Pokémon:", error);
    } finally {
      hideLoading();
    }
  }

  // Zeigt das Overlay mit zusätzlichen Pokémon-Details an
  function showOverlay(pokemon) {
    overlay.style.display = "flex";

    overlayImage.src = pokemon.sprites.other["official-artwork"].front_default;
    overlayName.textContent =
      pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

    overlayDetails.innerHTML = `
      <li>Height: ${pokemon.height}</li>
      <li>Weight: ${pokemon.weight}</li>
      <li>Base Experience: ${pokemon.base_experience}</li>
      <li>Types: ${pokemon.types.map((t) => t.type.name).join(", ")}</li>
      <li>Abilities: ${pokemon.abilities.map((a) => a.ability.name).join(", ")}</li>
      <li>Stats: ${pokemon.stats.map((s) => `${s.stat.name}: ${s.base_stat}`).join(", ")}</li>
    `;
  }

  // Schließt das Overlay
  function closeOverlay() {
    overlay.style.display = "none";
  }

  // Eingabefeld für die Suche (wird bei Eingabe überprüft)
  inputField.addEventListener("input", async (event) => {
    const query = event.target.value.trim();

    if (query.length >= 3) {
      hintMessage.textContent = "";
      isSearching = true;
      await loadPokemon(0, query);
      loadMoreButton.style.display = "none";
    } else if (query.length > 0) {
      hintMessage.textContent = "Bitte mindestens 3 Zeichen eingeben.";
    } else {
      hintMessage.textContent = "";
      isSearching = false;
      contentDiv.innerHTML = "";
      await loadPokemon(0);
      loadMoreButton.style.display = "block";
    }
  });

  // Button für "Mehr laden" klicken
  loadMoreButton.addEventListener("click", () => {
    offset += limit;
    loadPokemon(offset);
  });

  // Overlay schließen
  closeOverlayButton.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlay();
  });

  // Anfangs Pokémon laden
  loadPokemon(offset);
});
