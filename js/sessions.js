import { apiRequest } from "./api.js";

export async function loadWorkoutSessions() {
    const workoutSessionSelect =
        document.getElementById("workoutSessionSelect");

    const selectedSession = workoutSessionSelect.value;

    try {
        const sessions = await apiRequest("/workout-sessions");

        workoutSessionSelect.replaceChildren();

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select workout session";

        workoutSessionSelect.appendChild(defaultOption);

        for (const session of sessions) {
            const option = document.createElement("option");

            option.value = session.id;
            option.textContent = session.name;

            workoutSessionSelect.appendChild(option);
        }

        workoutSessionSelect.value = selectedSession;

    } catch (error) {
        console.error("Could not load workout sessions:", error);
    }
}