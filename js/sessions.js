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

export function initSessionCreation() {
    const nameInput = document.getElementById("newSessionName");
    const createButton = document.getElementById("createSessionButton");
    const errorElement = document.getElementById("sessionError");
    const sessionSelect = document.getElementById("workoutSessionSelect");

    createButton.addEventListener("click", async function () {
        errorElement.textContent = "";

        const name = nameInput.value.trim();

        if (!name) {
            errorElement.textContent = "Enter a workout name";
            return;
        }

        createButton.disabled = true;

        try {
            const response = await fetch("/api/workout-sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const session = await response.json();

            nameInput.value = "";

            await loadWorkoutSessions();

            sessionSelect.value = String(session.id);

        } catch (error) {
            console.error("Could not create workout:", error);
            errorElement.textContent = "Could not create workout";
        } finally {
            createButton.disabled = false;
        }
    });
}