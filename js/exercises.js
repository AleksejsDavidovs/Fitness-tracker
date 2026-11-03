
import { apiRequest } from "./api.js";

export async function fetchExercises() {
    return apiRequest("/exercises");
}

export function initExerciseCatalog(onCatalogLoaded) {
    // HTML elements
    const newExerciseName = document.getElementById("newExerciseName");
    const newMuscleGroup = document.getElementById("newMuscleGroup");
    const createExerciseButton = document.getElementById("createExerciseButton");
    const cancelExerciseEdit = document.getElementById("cancelExerciseEdit");
    const exerciseError = document.getElementById("exerciseError");

    const exerciseCatalog = document.getElementById("exerciseCatalog");
    const toggleExerciseCatalog = document.getElementById("toggleExerciseCatalog");

    const deleteModal = document.getElementById("deleteModal");
    const deleteModalMessage = document.getElementById("deleteModalMessage");
    const cancelDeleteButton = document.getElementById("cancelDeleteButton");
    const confirmDeleteButton = document.getElementById("confirmDeleteButton");

    // Catalog state
    let editingExerciseId = null;
    let exerciseToDelete = null;
    let isDeleting = false;
    let deleteTrigger = null;

    function resetExerciseForm() {
        editingExerciseId = null;

        newExerciseName.value = "";
        newMuscleGroup.value = "";

        createExerciseButton.textContent = "Create exercise";
        cancelExerciseEdit.hidden = true;
        exerciseError.textContent = "";
    }

    cancelExerciseEdit.addEventListener("click", resetExerciseForm);

    function renderExerciseCatalog(exercises) {
        exerciseCatalog.replaceChildren();

        for (const exercise of exercises) {
            const row = document.createElement("div");
            row.className = "exercise-item";

            const info = document.createElement("span");
            info.textContent = `${exercise.name} — ${exercise.muscle_group}`;

            // Edit
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

            // Delete
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", function () {
                exerciseToDelete = exercise;
                deleteTrigger = deleteButton;

                deleteModalMessage.textContent =
                    `Are you sure you want to delete "${exercise.name}"?`;

                deleteModal.hidden = false;
                confirmDeleteButton.focus();
            });

            row.append(info, editButton, deleteButton);
            exerciseCatalog.appendChild(row);
        }
    }

    async function loadExerciseCatalog() {
        try {
            const exercises = await fetchExercises();

            renderExerciseCatalog(exercises);

            // Notify the main application about catalog changes
            if (onCatalogLoaded) {
                onCatalogLoaded(exercises);
            }

        } catch (error) {
            console.error("Failed to load exercises:", error);
            exerciseError.textContent = "Could not load exercises";
        }
    }

    // Show / hide catalog
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
        if (isDeleting) return;

        deleteModal.hidden = true;
        exerciseToDelete = null;

        if (deleteTrigger?.isConnected) {
            deleteTrigger.focus();
        }

        deleteTrigger = null;
    }

    cancelDeleteButton.addEventListener("click", closeDeleteModal);

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

    // Confirm deletion
    confirmDeleteButton.addEventListener("click", async function () {
        if (!exerciseToDelete || isDeleting) return;

        const exerciseId = exerciseToDelete.id;
        isDeleting = true;
        confirmDeleteButton.disabled = true;

        try {
            await apiRequest(`/exercises/${exerciseId}`, {
                method: "DELETE"
            });

            if (editingExerciseId === exerciseId) {
                resetExerciseForm();
            }

            isDeleting = false;
            closeDeleteModal();
            await loadExerciseCatalog();

        } catch (error) {
            console.error("Could not delete exercise:", error);
            exerciseError.textContent = "Could not delete exercise";
        } finally {
            isDeleting = false;
            confirmDeleteButton.disabled = false;
        }
    });

    // Create or update exercise
    createExerciseButton.addEventListener("click", async function () {
        exerciseError.textContent = "";

        const name = newExerciseName.value.trim();
        const muscleGroup = newMuscleGroup.value;

        if (!name || !muscleGroup) {
            exerciseError.textContent = "Fill in all fields";
            return;
        }

        const isEditing = editingExerciseId !== null;

        const endpoint = isEditing
            ? `/exercises/${editingExerciseId}`
            : "/exercises";

        const method = isEditing ? "PUT" : "POST";

        createExerciseButton.disabled = true;

        try {
            await apiRequest(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    muscle_group: muscleGroup
                })
            });

            resetExerciseForm();
            await loadExerciseCatalog();

        } catch (error) {
            console.error("Could not save exercise:", error);
            exerciseError.textContent = "Could not save exercise";
        } finally {
            createExerciseButton.disabled = false;
        }
    });

    // Initial catalog loading
    loadExerciseCatalog();
}
