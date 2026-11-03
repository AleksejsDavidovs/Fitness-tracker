import { initNavigation } from "./navigation.js";
import { initExerciseCatalog } from "./exercises.js";
import { initWorkouts } from "./workouts.js";
import { initStatistics } from "./statistics.js";
import { loadWorkoutSessions } from "./sessions.js";

const exerciseInput = document.getElementById("exerciseInput");

initNavigation();

initExerciseCatalog(function (exercises) {
    const selectedExercise = exerciseInput.value;

    exerciseInput.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select exercise";
    exerciseInput.appendChild(defaultOption);

    for (const exercise of exercises) {
        const option = document.createElement("option");
        option.value = exercise.name;
        option.textContent = exercise.name;
        exerciseInput.appendChild(option);
    }

    exerciseInput.value = selectedExercise;
});

const statistics = initStatistics();

initWorkouts(function (workout) {
    statistics.updateWorkoutStatistics(workout);
});

loadWorkoutSessions();