const TYPES = ["T", "H", "V", "W"];
const COMPANIES = ["Empresa 1", "Empresa 2", "Empresa 3", "Empresa 4"];
const DEFAULT_PRICES = [
	[40, 70, 40, 90],
	[50, 80, 110, 80],
	[60, 50, 50, 100],
	[70, 100, 40, 110],
];

const elements = {
	tableBody: document.getElementById("tableBody"),
	resultPanel: document.getElementById("result"),
	resultBody: document.getElementById("resultBody"),
	heuristicValue: document.getElementById("heurValue"),
	totalValue: document.getElementById("totalValue"),
	solveButton: document.getElementById("solveButton"),
	resetButton: document.getElementById("resetButton"),
};

function buildTable(prices) {
	elements.tableBody.innerHTML = "";

	COMPANIES.forEach((companyName, companyIndex) => {
		const row = document.createElement("tr");
		row.innerHTML = `<td class="text-xs font-semibold text-stone-500 pr-2">${companyName}</td>` + TYPES.map(
			(_, typeIndex) => `
				<td class="text-center">
					<input id="p${companyIndex}${typeIndex}" type="number" min="0" class="cell-input" value="${prices[companyIndex][typeIndex]}" />
				</td>`,
		).join("");
		elements.tableBody.appendChild(row);
	});
}

function readPrices() {
	return COMPANIES.map((_, companyIndex) =>
		TYPES.map((_, typeIndex) => {
			const input = document.getElementById(`p${companyIndex}${typeIndex}`);
			const price = Number(input?.value);
			return Number.isFinite(price) && price >= 0 ? price : 0;
		}),
	);
}

function clearHighlights() {
	document.querySelectorAll(".highlight").forEach((element) => element.classList.remove("highlight"));
}

function highlightAssignment(assignment) {
	clearHighlights();

	assignment.forEach((typeIndex, companyIndex) => {
		const input = document.getElementById(`p${companyIndex}${typeIndex}`);
		input?.closest("td")?.classList.add("highlight");
	});
}

function estimateRemainingCost(prices, assignment) {
	const usedTypes = new Set(assignment.values());
	const freeCompanies = COMPANIES.map((_, companyIndex) => companyIndex).filter((companyIndex) => !assignment.has(companyIndex));
	const freeTypes = TYPES.map((_, typeIndex) => typeIndex).filter((typeIndex) => !usedTypes.has(typeIndex));

	return freeTypes.reduce((total, typeIndex) => {
		const bestOption = Math.min(...freeCompanies.map((companyIndex) => prices[companyIndex][typeIndex]));
		return total + bestOption;
	}, 0);
}

function solveAssignment(prices) {
	const startNode = {
		assignment: new Map(),
		gCost: 0,
		fScore: estimateRemainingCost(prices, new Map()),
	};
	const frontier = [startNode];

	while (frontier.length) {
		frontier.sort((left, right) => left.fScore - right.fScore || left.gCost - right.gCost);
		const node = frontier.shift();
		const assignedCount = node.assignment.size;

		if (assignedCount === COMPANIES.length) {
			return node;
		}

		const nextCompanyIndex = assignedCount;
		const usedTypes = new Set(node.assignment.values());
		const availableTypes = TYPES.map((_, typeIndex) => typeIndex).filter((typeIndex) => !usedTypes.has(typeIndex));

		for (const typeIndex of availableTypes) {
			const nextAssignment = new Map(node.assignment);
			nextAssignment.set(nextCompanyIndex, typeIndex);

			const gCost = node.gCost + prices[nextCompanyIndex][typeIndex];
			frontier.push({
				assignment: nextAssignment,
				gCost,
				fScore: gCost + estimateRemainingCost(prices, nextAssignment),
			});
		}
	}

	return null;
}

function renderSolution(prices, solution) {
	if (!solution) {
		return;
	}

	highlightAssignment(solution.assignment);
	elements.resultBody.innerHTML = "";

	COMPANIES.forEach((companyName, companyIndex) => {
		const typeIndex = solution.assignment.get(companyIndex);
		const row = document.createElement("tr");
		row.innerHTML = `
			<td class="py-2 text-stone-700 font-medium">${companyName}</td>
			<td class="py-2"><span class="tag">Tipo ${TYPES[typeIndex]}</span></td>
			<td class="py-2 text-right mono text-stone-800 font-bold">${prices[companyIndex][typeIndex]}</td>`;
		elements.resultBody.appendChild(row);
	});

	elements.heuristicValue.textContent = String(estimateRemainingCost(prices, new Map()));
	elements.totalValue.textContent = String(solution.gCost);
	elements.resultPanel.classList.remove("hidden");
	elements.resultPanel.classList.remove("fade-up");
	void elements.resultPanel.offsetWidth;
	elements.resultPanel.classList.add("fade-up");
}

function solve() {
	const prices = readPrices();
	const solution = solveAssignment(prices);
	renderSolution(prices, solution);
}

function resetDefaults() {
	buildTable(DEFAULT_PRICES);
	elements.resultPanel.classList.add("hidden");
	elements.resultPanel.classList.remove("fade-up");
	elements.resultBody.innerHTML = "";
	elements.heuristicValue.textContent = "";
	elements.totalValue.textContent = "";
	clearHighlights();
}

function bindEvents() {
	elements.solveButton.addEventListener("click", solve);
	elements.resetButton.addEventListener("click", resetDefaults);
}

function init() {
	resetDefaults();
	bindEvents();
}

init();