
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

let bodyWeightChart = null;

let bodyWeights = [];

console.log(exerciseInput, weightInput, addButton, exerciseContainer);

let workout = [];
let editingId = null;

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
        const exerciseElement = document.createElement("p");

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
                `http://127.0.0.1:8000/sets/${exerciseData.id}`,
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


        exerciseElement.textContent =
            `${exerciseData.exercise}: ${exerciseData.weight} kg x ${exerciseData.reps} reps `;

        exerciseDeleteButton.textContent = "Delete";

        exerciseElement.appendChild(exerciseDeleteButton);
        exerciseContainer.appendChild(exerciseElement);
        exerciseElement.appendChild(exerciseEditButton);
    }
}

async function loadBodyWeights() {
    const response = await fetch(
        "http://127.0.0.1:8000/body-weights"
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
        const weightElement = document.createElement("p");
        const deleteButton = document.createElement("button");

        const date = new Date(
            weightData.measured_at.replace(" ", "T") + "Z"
        );

        const formattedDate = date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
        
        weightElement.textContent =
            `${formattedDate} — ${weightData.weight} kg `;

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", async function () {
            const response = await fetch(
                `http://127.0.0.1:8000/body-weights/${weightData.id}`,
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

function renderBodyWeightChart() {
    const labels = [];
    const weights = [];

    for (const weightData of bodyWeights) {
        const date = new Date(
            weightData.measured_at.replace(" ", "T") + "Z"
        );
    
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
                    borderColor: "#22c55e",
                    backgroundColor: "#22c55e",
                    borderWidth: 3,
                    tension: 0.25
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                y: {
                    beginAtZero: false
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
        "http://127.0.0.1:8000/body-weights",
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
    const response = await fetch("http://127.0.0.1:8000/sets");
    const data = await response.json();

    workout = data;

    renderWorkout();
    fillExerciseSelect();
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

    let url = "http://127.0.0.1:8000/sets";
    let method = "POST";

    if (editingId !== null) {
        url = `http://127.0.0.1:8000/sets/${editingId}`;
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
loadWorkout();
loadBodyWeights();
