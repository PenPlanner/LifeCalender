// PocketBase hooks for real-time features and validation
routerAdd("POST", "/api/custom/health", (c) => {
    return c.json(200, { "status": "healthy", "timestamp": new Date().toISOString() });
});

// Hook for todo creation/updates to notify real-time subscribers
onRecordAfterCreateRequest("todos", (e) => {
    console.log("Todo created:", e.record.getId());
    
    // Broadcast to real-time subscribers
    // This would trigger WebSocket updates in connected frontend clients
});

onRecordAfterUpdateRequest("todos", (e) => {
    console.log("Todo updated:", e.record.getId());
    
    // Broadcast to real-time subscribers
});

onRecordAfterDeleteRequest("todos", (e) => {
    console.log("Todo deleted:", e.record.getId());
    
    // Broadcast to real-time subscribers
});

// Hook for supplement updates
onRecordAfterCreateRequest("supplements", (e) => {
    console.log("Supplement logged:", e.record.getId());
});

onRecordAfterUpdateRequest("supplements", (e) => {
    console.log("Supplement updated:", e.record.getId());
});

// Validation hooks
onRecordBeforeCreateRequest("todos", (e) => {
    // Validate todo text length
    const text = e.record.get("text");
    if (text && text.length > 500) {
        throw new BadRequestError("Todo text cannot exceed 500 characters");
    }
    
    // Validate date format
    const date = e.record.get("date");
    if (date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new BadRequestError("Date must be in YYYY-MM-DD format");
        }
    }
});

onRecordBeforeUpdateRequest("todos", (e) => {
    // Same validation for updates
    const text = e.record.get("text");
    if (text && text.length > 500) {
        throw new BadRequestError("Todo text cannot exceed 500 characters");
    }
});

// Settings validation
onRecordBeforeCreateRequest("settings", (e) => {
    const key = e.record.get("key");
    const validKeys = ["app_settings", "withings_credentials"];
    
    if (key && !validKeys.includes(key)) {
        throw new BadRequestError("Invalid settings key");
    }
});

onRecordBeforeUpdateRequest("settings", (e) => {
    const key = e.record.get("key");
    const validKeys = ["app_settings", "withings_credentials"];
    
    if (key && !validKeys.includes(key)) {
        throw new BadRequestError("Invalid settings key");
    }
});

// Supplement validation
onRecordBeforeCreateRequest("supplements", (e) => {
    const key = e.record.get("key");
    const validSupplements = ["vitamin_d", "omega_3", "creatine", "magnesium"];
    
    if (key && !validSupplements.includes(key)) {
        throw new BadRequestError("Invalid supplement key");
    }
    
    // Validate date format
    const date = e.record.get("date");
    if (date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new BadRequestError("Date must be in YYYY-MM-DD format");
        }
    }
});

onRecordBeforeUpdateRequest("supplements", (e) => {
    const key = e.record.get("key");
    const validSupplements = ["vitamin_d", "omega_3", "creatine", "magnesium"];
    
    if (key && !validSupplements.includes(key)) {
        throw new BadRequestError("Invalid supplement key");
    }
});