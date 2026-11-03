
import { API_URL } from "./api.js";

export function initStatistics() {
    const bodyWeightInput = document.getElementById("bodyWeightInput");
    const addWeightButton = document.getElementById("addWeightButton");
    const weightError = document.getElementById("weightError");
    const weightHistory = document.getElementById("weightHistory");
    const bodyWeightCanvas = document.getElementById("bodyWeightChart");
    const exerciseSelect = document.getElementById("exerciseSelect");

    let bodyWeights = [];
    let bodyWeightChart = null;

    function cssVar(name) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
    }

    async function loadBodyWeights() {
        try {
            const response = await fetch(`${API_URL}/body-weights`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            bodyWeights = await response.json();
            renderBodyWeights();

        } catch (error) {
            console.error("Could not load body weights:", error);
            weightError.textContent = "Could not load body weights";
        }
    }

    function renderBodyWeights() {
        weightHistory.replaceChildren();

        for (const weightData of bodyWeights) {
            const weightElement = document.createElement("div");
            weightElement.className = "weight-record";

            const date = new Date(weightData.measured_at);

            const formattedDate = date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

            weightElement.textContent =
                `${formattedDate} — ${weightData.weight} kg`;

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-button";

            deleteButton.addEventListener("click", async function () {
                deleteButton.disabled = true;

                try {
                    const response = await fetch(
                        `${API_URL}/body-weights/${weightData.id}`,
                        { method: "DELETE" }
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    await loadBodyWeights();

                } catch (error) {
                    console.error("Could not delete weight:", error);
                    weightError.textContent = "Could not delete weight";
                } finally {
                    deleteButton.disabled = false;
                }
            });

            weightElement.appendChild(deleteButton);
            weightHistory.appendChild(weightElement);
        }

        renderBodyWeightChart();
    }

    function renderBodyWeightChart() {
        const labels = [];
        const weights = [];

        for (const weightData of bodyWeights) {
            const date = new Date(weightData.measured_at);

            labels.push(
                date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short"
                })
            );

            weights.push(Number(weightData.weight));
        }

        if (bodyWeightChart !== null) {
            bodyWeightChart.destroy();
        }

        bodyWeightChart = new Chart(bodyWeightCanvas, {
            type: "line",

            data: {
                labels,
                datasets: [{
                    label: "Body weight, kg",
                    data: weights,
                    borderColor: cssVar("--color-accent"),
                    backgroundColor: cssVar("--color-accent"),
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.35
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: cssVar("--color-muted")
                        }
                    },
                    y: {
                        beginAtZero: false,
                        border: { display: false },
                        grid: {
                            color: cssVar("--color-rule")
                        },
                        ticks: {
                            color: cssVar("--color-muted")
                        }
                    }
                }
            }
        });
    }

    // Called whenever workout sets change
    function updateWorkoutStatistics(workout) {
        const selectedExercise = exerciseSelect.value;

        exerciseSelect.replaceChildren();

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select exercise";

        exerciseSelect.appendChild(defaultOption);

        const exerciseNames = new Set();

        for (const exerciseData of workout) {
            exerciseNames.add(exerciseData.exercise);
        }

        for (const exerciseName of exerciseNames) {
            const option = document.createElement("option");

            option.value = exerciseName;
            option.textContent = exerciseName;

            exerciseSelect.appendChild(option);
        }

        exerciseSelect.value = selectedExercise;
    }

    addWeightButton.addEventListener("click", async function () {
        weightError.textContent = "";
        bodyWeightInput.classList.remove("input-error");

        const weight = Number(bodyWeightInput.value);

        if (
            bodyWeightInput.value.trim() === "" ||
            !Number.isFinite(weight) ||
            weight <= 0
        ) {
            bodyWeightInput.classList.add("input-error");
            weightError.textContent = "Please enter a valid weight";
            return;
        }

        addWeightButton.disabled = true;

        try {
            const response = await fetch(`${API_URL}/body-weights`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ weight })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            bodyWeightInput.value = "";
            await loadBodyWeights();

        } catch (error) {
            console.error("Could not save weight:", error);
            weightError.textContent = "Could not save weight";
        } finally {
            addWeightButton.disabled = false;
        }
    });

    loadBodyWeights();

    return {
        updateWorkoutStatistics
    };
}
