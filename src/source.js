let repo = "JwowSquared/JwowSquared.github.io";

let species = {};
let sprites = {};
let abilities = {};
let moves = {};
let locations = {};
let types = {};

let speciesTableBody = document.querySelector("#speciesTable > tbody");
let speciesTracker = [];
let trackerIndex = 0;

const propComparator = (library, property) =>
  (a, b) => library[a.key][property] == library[b.key][property] ? 0 : library[a.key][property] < library[b.key][property] ? -1 : 1;
  
const subpropComparator = (library, property, subproperty) =>
  (a, b) => library[a.key][property][subproperty] == library[b.key][property][subproperty] ? 0 : library[a.key][property][subproperty] < library[b.key][property][subproperty] ? -1 : 1;

document.getElementById("speciesInput").oninput = function () {
	searchSpecies(this.value);
};
document.getElementById("sortDexID").onclick = function() {
	sortSpeciesTracker(this, "dexID");
};
document.getElementById("sortName").onclick = function() {
	sortSpeciesTracker(this, "name");
};
document.getElementById("sortAbility").onclick = function() {
	sortSpeciesTracker(this, "ability", "primary");
};
document.getElementById("sortHP").onclick = function() {
	sortSpeciesTracker(this, "stats", "HP");
};
document.getElementById("sortAtk").onclick = function() {
	sortSpeciesTracker(this, "stats", "attack");
};
document.getElementById("sortDef").onclick = function() {
	sortSpeciesTracker(this, "stats", "defense");
};
document.getElementById("sortSpA").onclick = function() {
	sortSpeciesTracker(this, "stats", "specialAttack");
};
document.getElementById("sortSpD").onclick = function() {
	sortSpeciesTracker(this, "stats", "specialDefense");
};
document.getElementById("sortSpe").onclick = function() {
	sortSpeciesTracker(this, "stats", "speed");
};
document.getElementById("sortBST").onclick = function() {
	sortSpeciesTracker(this, "stats", "total");
};

window.onscroll = function(ev) {
    if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
       loadChunk(false);
    }
};

function searchSpecies(inputValue) {
	
	clearFilter("input");
	
	if (inputValue.length > 1) {
		for (const target of speciesTracker) {
			if (!species[target.key].name.toLowerCase().includes(inputValue))
				target.filters.push("input");
		}
	}
	
	loadChunk(true);
}

function clearFilter(name) {
	for (const target of speciesTracker) {
		for (let i = 0; i < target.filters.length; i++) {
			if (name === target.filters[i])
				target.filters.splice(i, 1);
		}
	}
}

function sortSpeciesTracker(sortCategory, property, subproperty=null) {
	sortTracker(sortCategory, speciesTracker, species, property, subproperty);
}

function sortTracker(sortCategory, tracker, library, property, subproperty) {
	
	let prevClass = sortCategory.className;
	
	for (const element of sortCategory.parentNode.querySelectorAll("th[ID]"))
		element.className = "";
	
	sortCategory.className = "active sortAscending";
	
	if (prevClass === "") {
		if (subproperty === null)
			tracker.sort(propComparator(library, property));
		else
			tracker.sort(subpropComparator(library, property, subproperty));
	}
	else {
		if (prevClass === "active sortAscending") {
			sortCategory.className = "active sortDescending";
		}
	
		tracker.reverse();
	}
	
	loadChunk(true);
}

async function onStartup() {
	
	let requests = [];
	requests.push(new Request(`https://raw.githubusercontent.com/${repo}/master/data/species.js`));
	requests.push(new Request(`https://raw.githubusercontent.com/${repo}/master/data/sprites.js`));
	requests.push(new Request(`https://raw.githubusercontent.com/${repo}/master/data/abilities.js`));
	requests.push(new Request(`https://raw.githubusercontent.com/${repo}/master/data/moves.js`));
	requests.push(new Request(`https://raw.githubusercontent.com/${repo}/master/data/locations.js`));
	requests.push(new Request(`https://raw.githubusercontent.com/${repo}/master/data/types.js`));
	
	const cache = await caches.open("rrdex 1c");
	
	let responses = [];
	for (let i = 0; i < requests.length; i++) {
		let response = await cache.match(requests[i]);
		console.log(response);
		if (!response) {
			response = await fetch(requests[i]);
			cache.put(requests[i], response);
			response = await cache.match(requests[i]);
		}
		responses.push(response);
	}
	
	species = await responses[0].json();
	sprites = await responses[1].json();
	abilities = await responses[2].json();
	moves = await responses[3].json();
	locations = await responses[4].json();
	types = await responses[5].json();
	
	setupTables();
	document.getElementById("sortDexID").click();
	loadChunk(true);
}

function setupTables() {
	for (const key in species) {
		speciesTracker.push({"key": key, "filters": []});
	}
}

function loadChunk(toClear) {
	let rowsToAdd = 50;
	let rowsAdded = 0;
	
	if (toClear) {
		speciesTableBody.innerText = "";
		trackerIndex = 0;
		window.scrollTo(0, 0);
	}
	
	while (rowsAdded < rowsToAdd && trackerIndex < speciesTracker.length) {
		if (speciesTracker[trackerIndex].filters.length === 0) {
			appendSpeciesToTable(speciesTracker[trackerIndex].key);
			rowsAdded++;
		}
		trackerIndex++;
	}
}

function getSprite(key) {
	if (sprites[key])
		return sprites[key];
	
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	const img = new Image();
	img.onload = function () {
		ctx.drawImage(img, 0, 0);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	
		for ( let i = 0; i < imageData.data.length; i += 4) {
			if (imageData.data[i] === imageData.data[0] && 
				imageData.data[i + 1] === imageData.data[1] &&
				imageData.data[i + 2] === imageData.data[2])
				imageData.data[i + 3] = 0;
		}
		ctx.putImageData(imageData, 0, 0);
		img.onload = null;
		img.src = canvas.toDataURL();
	}
	sprites[key] = img;
	img.crossOrigin = "";
	img.src = spriteFolder + species[key].sprite;
	return img;
}

function displaySpeciesPanel(key) {
	console.log(key);
}

function appendSpeciesToTable(key) {

	let currentRow = document.createElement("tr");
	currentRow.id = key;
	currentRow.className = "speciesRow";
	currentRow.onclick = function() {
		displaySpeciesPanel(key);
	};
	speciesTableBody.appendChild(currentRow);
	
	let dexIDCell = document.createElement("td");
	dexIDCell.scope = "col";
	dexIDCell.className = "speciesDexIDCell";
	dexIDCell.textContent = species[key].dexID;
	currentRow.appendChild(dexIDCell);

	appendSpriteCell(currentRow, key);
	
	appendNameCell(currentRow, key);
	
	appendTypeCell(currentRow, key);
	
	appendAbilitiesCell(currentRow, key);
	
	appendStatCells(currentRow, key);
}

function appendSpriteCell(row, key) {
	let cell = document.createElement("td");
	cell.scope = "col";
	cell.className = "speciesSpriteCell";
	
	cell.appendChild(getSprite(key));
	
	row.appendChild(cell);
}

function appendNameCell(row, key) {
	let cell = document.createElement("td");
	cell.scope = "col";
	cell.className = "speciesNameCell";
	
	if (species[key].form.region) {
		let region = document.createElement("div");
		region.className = "speciesRegion";
		region.textContent = species[key].form.region;
		cell.appendChild(region);
	}
	
	let name = document.createElement("div");
	name.className = "speciesName";
	name.textContent = species[key].name;
	cell.appendChild(name);

	
	if (species[key].form.name) {
		let form = document.createElement("div");
		form.className = "speciesForm";
		form.textContent = species[key].form.name;
		cell.appendChild(form);
	}

	row.appendChild(cell);
}

function appendTypeCell(row, key) {
	let cell = document.createElement("td");
	cell.scope = "col";
	cell.className = "speciesTypeCell";
	
	let primary = document.createElement("div");
	primary.className = "speciesType";
	primary.style.backgroundColor = types[species[key].type.primary].color;
	primary.textContent = types[species[key].type.primary].name;
	cell.appendChild(primary);
	
	if (species[key].type.secondary) {
		let secondary = document.createElement("div");
		secondary.className = "speciesType";
		secondary.style.backgroundColor = types[species[key].type.secondary].color;
		secondary.textContent = types[species[key].type.secondary].name;
		cell.appendChild(secondary);
	}
	
	row.appendChild(cell);
}

function appendAbilitiesCell(row, key) {
	let cell = document.createElement("td");
	cell.scope = "col";
	cell.className = "speciesAbilitiesCell";
	
	if (species[key].ability.primary) {
		let primary = document.createElement("div");
		primary.className = "speciesAbilityPrimary";
		primary.textContent = abilities[species[key].ability.primary].name;
		cell.appendChild(primary);
	}
	
	if (species[key].ability.secondary) {
		let secondary = document.createElement("div");
		secondary.className = "speciesAbilitySecondary";
		secondary.textContent = abilities[species[key].ability.secondary].name;
		cell.appendChild(secondary);
	}
	
	if (species[key].ability.hidden) {
		let hidden = document.createElement("div");
		hidden.className = "speciesAbilityHidden";
		hidden.textContent = abilities[species[key].ability.hidden].name;
		cell.appendChild(hidden);
	}

	row.appendChild(cell);
}

function appendStatCells(row, key) {
	let statLabels = ["HP", "Atk", "Def", "SpA", "SpD", "Spe", "BST"];
	let statValues = ["HP", "attack", "defense", "specialAttack", "specialDefense", "speed", "total"];

	for (let i = 0; i < statValues.length; i++) {
		let cell = document.createElement("td");
		cell.scope = "col";
		cell.className = "speciesStatCell";
		
		let statLabel = document.createElement("div");
		statLabel.className = "speciesStatLabel";
		statLabel.textContent = statLabels[i];
		cell.appendChild(statLabel);
		
		let statValue = document.createElement("div");
		statValue.className = "speciesStatValue";
		statValue.textContent = species[key].stats[statValues[i]];
		cell.appendChild(statValue);
		row.appendChild(cell);
	}
}

onStartup();