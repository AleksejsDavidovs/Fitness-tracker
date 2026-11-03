import { API_URL } from "./api.js";

export function initWorkouts(onWorkoutsLoaded) {
    const exerciseInput = document.getElementById("exerciseInput");
    const weightInput = document.getElementById("weightInput");
    const repsInput = document.getElementById("repsInput");

    const addButton = document.getElementById("addButton");
    const cancelButton = document.getElementById("cancelButton");
    const exerciseContainer = document.getElementById("exerciseContainer");
    const formError = document.getElementById("formError");

    let workout = [];
    let editingId = null;

    function resetWorkoutForm() {
        editingId = null;

        exerciseInput.value = "";
        weightInput.value = "";
        repsInput.value = "";

        exerciseInput.classList.remove("input-error");
        weightInput.classList.remove("input-error");
        repsInput.classList.remove("input-error");

        addButton.textContent = "Add set";
        cancelButton.style.display = "none";
        formError.textContent = "";
    }

    function renderWorkout() {
        exerciseContainer.replaceChildren();

        for (const exerciseData of workout) {
            const exerciseElement = document.createElement("div");
            exerciseElement.className = "set-row";

            const exerciseInfo = document.createElement("div");
            exerciseInfo.className = "set-info";

            const exerciseName = document.createElement("span");
            exerciseName.className = "set-name";
            exerciseName.textContent = exerciseData.exercise;

            const exerciseMeta = document.createElement("span");
            exerciseMeta.className = "set-meta";
            exerciseMeta.textContent =
                `${exerciseData.weight} kg × ${exerciseData.reps} reps`;

            exerciseInfo.append(exerciseName, exerciseMeta);

            const exerciseActions = document.createElement("div");
            exerciseActions.className = "set-actions";

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.className = "edit-button";

            editButton.addEventListener("click", function () {
                editingId = exerciseData.id;

                exerciseInput.value = exerciseData.exercise;
                weightInput.value = exerciseData.weight;
                repsInput.value = exerciseData.reps;

                addButton.textContent = "Save changes";
                cancelButton.style.display = "inline-block";
                formError.textContent = "";

                exerciseInput.classList.remove("input-error");
                weightInput.classList.remove("input-error");
                repsInput.classList.remove("input-error");

                exerciseInput.focus();
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-button";

            deleteButton.addEventListener("click", async function () {
                deleteButton.disabled = true;

                try {
                    const response = await fetch(
                        `${API_URL}/sets/${exerciseData.id}`,
                        { method: "DELETE" }
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    if (editingId === exerciseData.id) {
                        resetWorkoutForm();
                    }

                    await loadWorkout();

                } catch (error) {
                    console.error("Could not delete set:", error);
                    formError.textContent = "Could not delete set";
                    deleteButton.disabled = false;
                }
            });

            exerciseActions.append(editButton, deleteButton);
            exerciseElement.append(exerciseInfo, exerciseActions);
            exerciseContainer.appendChild(exerciseElement);
        }
    }

    async function loadWorkout() {
        try {
            const response = await fetch(`${API_URL}/sets`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            workout = await response.json();

            renderWorkout();

            if (onWorkoutsLoaded) {
                onWorkoutsLoaded(workout);
            }

        } catch (error) {
            console.error("Could not load workouts:", error);
            formError.textContent = "Could not connect to server";
        }
    }

    cancelButton.addEventListener("click", resetWorkoutForm);

    addButton.addEventListener("click", async function () {
        formError.textContent = "";

        exerciseInput.classList.remove("input-error");
        weightInput.classList.remove("input-error");
        repsInput.classList.remove("input-error");

        let hasError = false;

        if (!exerciseInput.value.trim()) {
            exerciseInput.classList.add("input-error");
            hasError = true;
        }

        if (weightInput.value === "" ||
            !Number.isFinite(Number(weightInput.value))) {
            weightInput.classList.add("input-error");
            hasError = true;
        }

        if (repsInput.value === "" ||
            !Number.isInteger(Number(repsInput.value)) ||
            Number(repsInput.value) <= 0) {
            repsInput.classList.add("input-error");
            hasError = true;
        }

        if (hasError) {
            formError.textContent = "Please enter valid values";
            return;
        }

        const newSet = {
            exercise: exerciseInput.value,
            weight: Number(weightInput.value),
            reps: Number(repsInput.value)
        };

        const url = editingId !== null
            ? `${API_URL}/sets/${editingId}`
            : `${API_URL}/sets`;

        const method = editingId !== null ? "PUT" : "POST";

        addButton.disabled = true;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newSet)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            resetWorkoutForm();
            await loadWorkout();

        } catch (error) {
            console.error("Could not save set:", error);
            formError.textContent = "Could not save set";
        } finally {
            addButton.disabled = false;
        }
    });

    loadWorkout();
}
