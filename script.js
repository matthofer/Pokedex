let allPokemon = [];
let displayedPokemonNames = new Set();
let offset = 0;
const limit = 15;
let isSearching = false;
let allPokemonLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
  const contentDiv = document.getElementById("content");
  const loadMoreButton = document.getElementById("load-more");
  const loadingScreen = document.getElementById("loading-screen");
  const body = document.body;
  const inputField = document.querySelector(".header-input input");
  const hintMessage = document.createElement("div");

  hintMessage.classList.add("hint-message");
  inputField.parentElement.appendChild(hintMessage);

  if (!contentDiv || !loadMoreButton || !loadingScreen || !inputField) {
    console.error("Fehlende essentielle Elemente.");
    return;
  }

  function showLoading() {
    loadingScreen.style.display = "flex";
    body.style.overflow = "hidden";
  }

  function hideLoading() {
    setTimeout(() => {
      loadingScreen.style.display = "none";
      body.style.overflow = "auto";
    }, 1000);
  }

  async function fetchPokemon(offset, limit) {
    const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    return await response.json();
  }

  async function loadAllPokemon() {
    if (allPokemonLoaded) return;

    const url = `https://pokeapi.co/api/v2/pokemon?limit=1000`;
    const response = await fetch(url);
    const data = await response.json();

    allPokemon.push(...data.results);
    allPokemonLoaded = true;
  }

  async function renderPokemon(pokemonList, isSearch = false) {
    if (isSearch) {
      displayedPokemonNames.clear();
    }

    for (const pokemon of pokemonList) {
      if (!displayedPokemonNames.has(pokemon.name)) {
        const pokemonData = await fetch(pokemon.url);
        const pokemonDetails = await pokemonData.json();

        const pokemonCard = document.createElement("div");
        pokemonCard.classList.add("pokemon-card");

        const pokemonImage = document.createElement("img");
        pokemonImage.src = pokemonDetails.sprites.front_default;
        pokemonCard.appendChild(pokemonImage);

        const pokemonName = document.createElement("h2");
        pokemonName.textContent =
          pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
        pokemonCard.appendChild(pokemonName);

        contentDiv.appendChild(pokemonCard);
        displayedPokemonNames.add(pokemon.name);
      }
    }
  }

  async function loadPokemon(offset, filter = "") {
    try {
      showLoading();

      if (filter) {
        await loadAllPokemon();

        const filteredPokemon = allPokemon.filter((pokemon) =>
          pokemon.name.toLowerCase().startsWith(filter.toLowerCase())
        );

        contentDiv.innerHTML = "";
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

  loadMoreButton.addEventListener("click", () => {
    offset += limit;
    loadPokemon(offset);
  });

  loadPokemon(offset);
});
