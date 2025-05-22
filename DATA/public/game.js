const data = require('./data'); // data.js is now user-aware
const dateUtils = require('./dateUtils'); // dateUtils is not used in this refactored version. Can be removed if not used elsewhere.

// Calculates level based on familiarity (0-100 scale).
// This interpretation assumes familiarity directly drives level calculation.
async function calculateLevel(familiarity) {
    if (familiarity < 0) familiarity = 0;
    if (familiarity > 100) familiarity = 100;

    // Example leveling: level 0 for 0-9 familiarity, level 1 for 10-19, ..., level 10 for 100.
    const level = Math.floor(familiarity / 10);
    
    // Points within the current level's 10-point familiarity range
    const pointsInLevelRange = familiarity % 10;
    const pointsNeededForNextLevelInThisRange = 10; // Each level spans 10 familiarity points

    // Progress for the current 10-point familiarity range towards the next level
    const progress = Math.floor((pointsInLevelRange / pointsNeededForNextLevelInThisRange) * 100);

    return {
        level, // Derived level e.g. 0-10
        currentLevelPoints: pointsInLevelRange, // Points (familiarity) into current 10-point range
        pointsForNextLevel: pointsNeededForNextLevelInThisRange, // Points (familiarity) to reach next 10-point threshold
        progress, // Percentage progress within the current 10-point familiarity range
        familiarity // Return current familiarity as well
    };
}

async function addPoints(userId, skillName, pointsToAdd) {
    if (!userId) throw new Error("userId is required for addPoints.");
    if (!skillName) throw new Error("skillName is required for addPoints.");
    
    pointsToAdd = parseInt(pointsToAdd) || 0;
    if (pointsToAdd === 0) { // No change, no need to proceed
        // Or return current state if preferred
        // const currentSkillForZeroAdd = await data.getSkillData(userId, skillName);
        // if (!currentSkillForZeroAdd) throw new Error(`Навык с именем ${skillName} не найден для пользователя ${userId}`);
        // return calculateLevel(currentSkillForZeroAdd.familiarity);
        console.log("addPoints called with 0 pointsToAdd for skill:", skillName, "user:", userId);
        // To ensure a consistent return type, fetch current skill and return its level info
        const skillForZeroAdd = await data.getSkillData(userId, skillName);
        if (!skillForZeroAdd) {
            throw new Error(`Навык с именем ${skillName} не найден для пользователя ${userId}`);
        }
        return calculateLevel(skillForZeroAdd.familiarity);
    }

    try {
        const skill = await data.getSkillData(userId, skillName);
        if (!skill) {
            throw new Error(`Навык с именем ${skillName} не найден для пользователя ${userId}`);
        }

        const currentFamiliarity = skill.familiarity || 0;
        // Ensure familiarity stays within 0-100 range
        const newFamiliarity = Math.max(0, Math.min(100, currentFamiliarity + pointsToAdd));

        // Update the skill with new familiarity
        // Ensure all necessary fields for writeSkillData are included, especially user_id
        await data.writeSkillData(userId, {
            id: skill.id,
            user_id: userId, // writeSkillData in public/data.js expects user_id as first param, skillData as second.
                            // pgData.writeData in pg-data.js expects user_id within the data object.
                            // My public/data.js writeSkillData(user_id, skillData) correctly puts user_id into dataToWrite.
            name: skill.name,
            familiarity: newFamiliarity,
            description: skill.description, // Preserve other fields
            complexity: skill.complexity
        });

        // Log a history event for adding points
        await data.addHistoryEvent(userId, {
            skill_id: skill.id,
            user_id: userId, // addHistoryEvent in public/data.js also expects user_id as first param.
                            // pgData.writeData in pg-data.js expects user_id within the data object.
                            // My public/data.js addHistoryEvent(user_id, recordData) correctly puts user_id into dataToWrite.
            event_type: pointsToAdd > 0 ? 'points_increased' : 'points_decreased',
            notes: `Points ${pointsToAdd > 0 ? 'added' : 'removed'}: ${pointsToAdd}. Familiarity changed from ${currentFamiliarity} to ${newFamiliarity}.`
        });
        
        return calculateLevel(newFamiliarity);
    } catch (error) {
        console.error(`Error in addPoints for user ${userId}, skill ${skillName}:`, error);
        throw error;
    }
}

// Recalculates skill progress based on its current familiarity.
// The original premise of summing history points is no longer valid with current DB schema.
async function recalculateSkillProgress(userId, skillName) {
    if (!userId) throw new Error("userId is required for recalculateSkillProgress.");
    if (!skillName) throw new Error("skillName is required for recalculateSkillProgress.");
    try {
        const skill = await data.getSkillData(userId, skillName);
        if (!skill) {
            throw new Error(`Навык с именем ${skillName} не найден для пользователя ${userId} при пересчете прогресса.`);
        }

        // Level and progress are derived directly from familiarity.
        return calculateLevel(skill.familiarity);
    } catch (error) {
        console.error(`Error in recalculateSkillProgress for user ${userId}, skill ${skillName}:`, error);
        throw error;
    }
}

module.exports = {
    calculateLevel,
    addPoints,
    recalculateSkillProgress
};