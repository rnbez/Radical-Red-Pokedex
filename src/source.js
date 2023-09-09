let repo = "JwowSquared/JwowSquared.github.io";

let species = null;
let sprites = null;
let abilities = null;
let moves = null;
let locations = null;
let types = null;
let caps = null;

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

function showMessage(parent, message) {
	let p = document.createElement("p");
	p.innerText = message;
	parent.append(p);
}

async function onStartup() {
	
	let loadingScreen = document.getElementById("loadingScreen");
	let files = [
		"species",
		"sprites",
		"abilities",
		"moves",
		"locations",
		"types",
		"caps"
	];
	try {
		let requests = [];
		for (let i = 0; i < files.length; i++)
			requests.push(new Request(`https://raw.githubusercontent.com/${repo}/master/data/${files[i]}.js`));
		
		const cache = await caches.open("rrdex release 1.0");
		
		let responses = [];
		for (let i = 0; i < requests.length; i++) {
			showMessage(loadingScreen, `Loading ${files[i]}...`);
			let response = await cache.match(requests[i]);
			if (!response) {
				response = await fetch(requests[i]);
				await cache.put(requests[i], response);
			}
			responses.push(await cache.match(requests[i]));
		}
	
		showMessage(loadingScreen, "Parsing JSON...");
		species = await responses[0].json();
		sprites = await responses[1].json();
		abilities = await responses[2].json();
		moves = await responses[3].json();
		locations = await responses[4].json();
		types = await responses[5].json();
		caps = await responses[6].json();
	}
	catch (e) {
		showMessage(loadingScreen, "Error encountered. Please wait a few minutes and refresh the page.");
		showMessage("If that doesn't work, ping @Jwow in the Radical Red discord.");
		return;
	}
	loadingScreen.className = "hide";
	document.querySelector("main").className = "";
	setupTables();
	document.getElementById("sortDexID").click();
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
	
	let img = document.createElement("img");
	img.className = "speciesSprite";
	img.alt = species[key].name;
	img.src = sprites[key].sprite;
	
	cell.appendChild(img);
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