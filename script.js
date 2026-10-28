const API_URL = "/api";
const exerciseInput = document.getElementById("exerciseInput");
const weightInput = document.getElementById("weightInput");
const addButton = document.getElementById("addButton");
const cancelButton = document.getElementById("cancelButton");
const exerciseContainer = document.getElementById("exerciseContainer");
const repsInput = document.getElementById("repsInput");
const bodyWeightInput = document.getElementById("bodyWeightInput");
const addWeightButton = document.getElementById("addWeightButton");
const weightError = document.getElementById("weightError");
const weightHistory = document.getElementById("weightHistory");
const bodyWeightCanvas = document.getElementById("bodyWeightChart");
const exerciseSelect = document.getElementById("exerciseSelect")
const newExerciseName = document.getElementById("newExerciseName");
const newMuscleGroup = document.getElementById("newMuscleGroup");
const createExerciseButton = document.getElementById("createExerciseButton");
const exerciseError = document.getElementById("exerciseError");
const exerciseCatalog = document.getElementById("exerciseCatalog");
const toggleExerciseCatalog = document.getElementById("toggleExerciseCatalog");
const cancelExerciseEdit = document.getElementById("cancelExerciseEdit");
const deleteModal = document.getElementById("deleteModal");
const deleteModalMessage = document.getElementById("deleteModalMessage");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");

let exerciseToDelete = null;

let bodyWeightChart = null;

let bodyWeights = [];

console.log(exerciseInput, weightInput, addButton, exerciseContainer);

let workout = [];
let editingId = null;
let editingExerciseId = null;

const formError = document.getElementById("formError");

const menuButtons = document.querySelectorAll(".menu-button"); 
const pages = document.querySelectorAll(".page");

for (const button of menuButtons) {
    button.addEventListener("click", function (){
        const pageId = button.dataset.page;

        for (const page of pages) {
            page.classList.add("hidden");
        }
        for (const menuButton of menuButtons) {
            menuButton.classList.remove("active");
        }

        document.getElementById(pageId).classList.remove("hidden");
        button.classList.add("active");
    });
}

function renderWorkout() {
    exerciseContainer.textContent = "";

    for (const exerciseData of workout) {
        const exerciseElement = document.createElement("div");
        exerciseElement.className = "set-row";

        const exerciseEditButton = document.createElement("button");
        exerciseEditButton.textContent = "Edit";
        exerciseEditButton.classList.add("edit-button");
        exerciseEditButton.addEventListener("click", function () {
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

        const exerciseDeleteButton = document.createElement("button");
        exerciseDeleteButton.className = "delete-button";
        exerciseDeleteButton.addEventListener("click", async function() {
            const response = await fetch(
                `${API_URL}/sets/${exerciseData.id}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                alert("Could not delete exercise");
                return;
            }
            const exerciseIndex = workout.indexOf(exerciseData);

            workout.splice(exerciseIndex, 1);
            renderWorkout()
        })


        const exerciseInfo = document.createElement("div");
        exerciseInfo.className = "set-info";

        const exerciseName = document.createElement("span");
        exerciseName.className = "set-name";
        exerciseName.textContent = exerciseData.exercise;

        const exerciseMeta = document.createElement("span");
        exerciseMeta.className = "set-meta";
        exerciseMeta.textContent = `${exerciseData.weight} kg × ${exerciseData.reps} reps`;

        exerciseInfo.appendChild(exerciseName);
        exerciseInfo.appendChild(exerciseMeta);

        const exerciseActions = document.createElement("div");
        exerciseActions.className = "set-actions";

        exerciseDeleteButton.textContent = "Delete";

        exerciseActions.appendChild(exerciseEditButton);
        exerciseActions.appendChild(exerciseDeleteButton);

        exerciseElement.appendChild(exerciseInfo);
        exerciseElement.appendChild(exerciseActions);
        exerciseContainer.appendChild(exerciseElement);
    }
}

function resetExerciseForm() {
    editingExerciseId = null;

    newExerciseName.value = "";
    newMuscleGroup.value = "";

    createExerciseButton.textContent = "Create exercise";
    cancelExerciseEdit.hidden = true;
    exerciseError.textContent = "";
}
cancelExerciseEdit.addEventListener("click", resetExerciseForm);

async function loadBodyWeights() {
    const response = await fetch(
        `${API_URL}/body-weights`
    );
                
    if (!response.ok) {
        weightError.textContent = "Could not load weight history";
        return;
    }
                
    bodyWeights = await response.json();
    renderBodyWeights();
}

const weightElement = document.createElement("p");
weightElement.className = "weight-record";

function renderBodyWeights() {
    weightHistory.textContent = "";

    for (const weightData of bodyWeights) {
        const weightElement = document.createElement("div");
        weightElement.className = "weight-record";
        const deleteButton = document.createElement("button");

        const date = new Date(weightData.measured_at);

        const formattedDate = date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
        
        weightElement.textContent =
            `${formattedDate} — ${weightData.weight} kg`;

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", async function () {
            const response = await fetch(
                `${API_URL}/body-weights/${weightData.id}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                weightError.textContent = "Could not delete weight";
                return;
            }

            await loadBodyWeights();
        });

        weightElement.appendChild(deleteButton);
        weightHistory.appendChild(weightElement);
    }
    renderBodyWeightChart();
}

// Reads a colour from the CSS tokens, so the chart matches the page (and dark mode)
function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function renderExerciseCatalog(exercises) {
    exerciseCatalog.replaceChildren();

    for (const exercise of exercises) {
        const row = document.createElement("div");
        row.className = "exercise-item";

        const info = document.createElement("span");
        info.textContent = `${exercise.name} — ${exercise.muscle_group}`;

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function () {
            editingExerciseId = exercise.id;

            newExerciseName.value = exercise.name;
            newMuscleGroup.value = exercise.muscle_group;

            createExerciseButton.textContent = "Save changes";
            cancelExerciseEdit.hidden = false;

            newExerciseName.focus();
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            exerciseToDelete = exercise;

            deleteModalMessage.textContent =
                `Are you sure you want to delete "${exercise.name}"?`;

            deleteModal.hidden = false;
            confirmDeleteButton.focus();
        });

        row.append(info, editButton, deleteButton);
        exerciseCatalog.appendChild(row);
    }
}

toggleExerciseCatalog.addEventListener("click", function () {
    const isHidden = exerciseCatalog.hidden;

    exerciseCatalog.hidden = !isHidden;

    toggleExerciseCatalog.textContent = isHidden
        ? "Hide exercises"
        : "Show exercises";

    toggleExerciseCatalog.setAttribute(
        "aria-expanded",
        String(isHidden)
    );
});

function closeDeleteModal() {
    deleteModal.hidden = true;
    exerciseToDelete = null;
}

deleteModal.addEventListener("click", function (event) {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !deleteModal.hidden) {
        closeDeleteModal();
    }
});

cancelDeleteButton.addEventListener("click", closeDeleteModal);

confirmDeleteButton.addEventListener("click", async function () {
    if (!exerciseToDelete) return;

    const exerciseId = exerciseToDelete.id;
    confirmDeleteButton.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/exercises/${exerciseId}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        if (editingExerciseId === exerciseId) {
            resetExerciseForm();
        }

        closeDeleteModal();
        await loadExerciseCatalog();

    } catch (error) {
        console.error(error);
        exerciseError.textContent = "Could not delete exercise";
        closeDeleteModal();
    } finally {
        confirmDeleteButton.disabled = false;
    }
});

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
            labels: labels,

            datasets: [
                {
                    label: "Body weight, kg",
                    data: weights,
                    borderColor: cssVar("--color-accent"),
                    backgroundColor: cssVar("--color-accent"),
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.35
                }
            ]
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
                    ticks: { color: cssVar("--color-muted") }
                },
                y: {
                    beginAtZero: false,
                    border: { display: false },
                    grid: { color: cssVar("--color-rule") },
                    ticks: { color: cssVar("--color-muted") }
                }
            }
        }
    });
}

function fillExerciseSelect() {
    exerciseSelect.textContent = "";

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
}


addWeightButton.addEventListener("click", async function () {
    weightError.textContent = "";
    bodyWeightInput.classList.remove("input-error");

    if (bodyWeightInput.value === "") {
        bodyWeightInput.classList.add("input-error");
        weightError.textContent = "Please enter your weight";
        return;
    }

    const weightData = {
        weight: Number(bodyWeightInput.value)
    };

    const response = await fetch(
        `${API_URL}/body-weights`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(weightData)
        }
    );

    if (!response.ok) {
        weightError.textContent = "Could not save weight";
        return;
    }

    const savedWeight = await response.json();
    console.log("Saved weight:", savedWeight);

    bodyWeightInput.value = "";
    await loadBodyWeights();
});

cancelButton.addEventListener("click", function() {
    editingId = null;

    exerciseInput.value = "";
    weightInput.value = "";
    repsInput.value = "";

    exerciseInput.classList.remove("input-error");
    weightInput.classList.remove("input-error");
    repsInput.classList.remove("input-error");

    formError.textContent = "";
    addButton.textContent = "Add exercises";
    cancelButton.style.display = "none";

});




async function loadWorkout() {
    try {
        const response = await fetch(`${API_URL}/sets`);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        workout = await response.json();

        renderWorkout();
        fillExerciseSelect();

    } catch (error) {
        console.error("Could not load workouts:", error);
        formError.textContent = "Could not connect to server";
    }
}


addButton.addEventListener("click", async function () {
    formError.textContent = "";

    exerciseInput.classList.remove("input-error");
    weightInput.classList.remove("input-error");
    repsInput.classList.remove("input-error");

    let hasError = false;

    if(exerciseInput.value.trim() === "") {
        exerciseInput.classList.add("input-error");
        hasError = true;
    }

    if(weightInput.value === "") {
        weightInput.classList.add("input-error");
        hasError = true;
    }

    if(repsInput.value === "") {
        repsInput.classList.add("input-error");
        hasError = true;
    }

    if (hasError) {
        formError.textContent = "Please fill in all fields";
        return;
    }
    const newExercise = {
        exercise: exerciseInput.value,
        weight: Number(weightInput.value),
        reps: Number(repsInput.value)
    };

    let url = `${API_URL}/sets`;
    let method = "POST";

    if (editingId !== null) {
        url = `${API_URL}/sets/${editingId}`;
        method = "PUT";
    }

    const response = await fetch(url, {
        method: method,
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(newExercise)
    });

    if (!response.ok) {
        formError.textContent = "Could not save exercise";
        return;
    }

    editingId = null;
    addButton.textContent = "Add exercises";
    cancelButton.style.display = "none";

    exerciseInput.value = "";
    weightInput.value = "";
    repsInput.value = "";
    formError.textContent = "";
    await loadWorkout();
});

async function loadExerciseCatalog() {
    try {
        const response = await fetch(`${API_URL}/exercises`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const exercises = await response.json();
        renderExerciseCatalog(exercises);

        exerciseInput.innerHTML = '<option value="">Select exercise</option>';

        for (const exercise of exercises) {
            const option = document.createElement("option");

            option.value = exercise.name;
            option.textContent = exercise.name;

            exerciseInput.appendChild(option);
        }

    } catch (error) {
        console.error("Failed to load exercises:", error);
    }
}

createExerciseButton.addEventListener("click", async function () {
    exerciseError.textContent = "";

    const name = newExerciseName.value.trim();
    const muscleGroup = newMuscleGroup.value;

    if (!name || !muscleGroup) {
        exerciseError.textContent = "Fill in all fields";
        return;
    }

    let url = `${API_URL}/exercises`;
    let method = "POST";

    if (editingExerciseId !== null) {
        url = `${API_URL}/exercises/${editingExerciseId}`;
        method = "PUT";
    }

    createExerciseButton.disabled = true;

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                muscle_group: muscleGroup
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        editingExerciseId = null;

        resetExerciseForm();

        await loadExerciseCatalog();

    } catch (error) {
        console.error(error);
        exerciseError.textContent = "Could not save exercise";
    } finally {
        createExerciseButton.disabled = false;
    }
});

loadExerciseCatalog();
loadWorkout();
loadBodyWeights();
