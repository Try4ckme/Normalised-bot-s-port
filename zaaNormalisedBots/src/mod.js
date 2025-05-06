"use strict";

class Mod {
	postDBLoad(container) {
		// constants
		const logger = container.resolve("WinstonLogger");
		const jsonUtil = container.resolve("JsonUtil");
		const modPath = __dirname.split("\\").slice(0, -1).join("\\");
		const fs = require("fs");
		const database = container.resolve("DatabaseServer").getTables();
		const dbBots = database.bots.types;
		
		const config = require("../config/config.json");
		
		let botSettings = {};
		for (const botType in dbBots) {
			// get the config values to each bot
			botSettings[botType] = jsonUtil.clone(config.MainSettings);
			
			const personalConfig = botSettings[botType];
			
			// handle overwrites
			if (config.OverwriteBots[botType]) {
				const overwriteConfig = config.OverwriteBots[botType];
				
				// skip if it has dont affect entry
				if (overwriteConfig.DontAffect) {
					continue;
				}
				
				// replace config values
				// skills
				if (overwriteConfig.RemoveCheatySkills) {
					for (const skillsEntry in overwriteConfig.RemoveCheatySkills) {
						personalConfig.RemoveCheatySkills[skillsEntry] = overwriteConfig.RemoveCheatySkills[skillsEntry];
					}
				}
				
				// health
				if (overwriteConfig.ChangeHealth) {
					if (overwriteConfig.ChangeHealth.Enabled !== undefined) {
						personalConfig.ChangeHealth.Enabled = overwriteConfig.ChangeHealth.Enabled;
					}
					
					if (overwriteConfig.ChangeHealth.HealthValues) {
						for (const healthEntry in overwriteConfig.ChangeHealth.HealthValues) {
							personalConfig.ChangeHealth.HealthValues[healthEntry] = overwriteConfig.ChangeHealth.HealthValues[healthEntry];
						}
					}
				}
				
				// add more gear
				if (overwriteConfig.AddMoreGear !== undefined) {
					personalConfig.AddMoreGear = overwriteConfig.AddMoreGear;
					
				}
			}
			
			// change health
			if (personalConfig.ChangeHealth.Enabled) {
				Mod.changeHealth(dbBots, botType, personalConfig.ChangeHealth.HealthValues);
			}
			
			// remove instant bot reload & infinite stamina & silent movement
			if (personalConfig.RemoveCheatySkills.BotSound) {
				if (dbBots[botType].skills.Common) {
					dbBots[botType].skills.Common.BotSound = {"min": 0, "max": 0};
				}
			}
			
			if (personalConfig.RemoveCheatySkills.BotReload) {
				if (dbBots[botType].skills.Common) {
					dbBots[botType].skills.Common.BotReload = {"min": 0, "max": 0};
				}
			}
			
			if (personalConfig.RemoveCheatySkills.EternityStamina) {
				if (dbBots[botType].difficulty) {
					for (const difficulty in dbBots[botType].difficulty) {
						if (dbBots[botType].difficulty[difficulty].Move) {
							dbBots[botType].difficulty[difficulty].Move.ETERNITY_STAMINA = false;
						}
					}
				}
			}
			
			// some bot gear changes to balance out lower health
			if (personalConfig.AddMoreGear) {
				const inv = dbBots[botType].inventory;
				const chances = dbBots[botType].chances;
				
				if (fs.existsSync(`${modPath}\\db\\bots\\${botType}.json`)) 
				{
					const botFile = require(`${modPath}\\db\\bots\\${botType}.json`);
					
					// add gear
					for (const equipmentCategory in botFile.inventory.equipment) {
						for (const itemToAdd in botFile.inventory.equipment[equipmentCategory]) {
							if (!inv.equipment[equipmentCategory][itemToAdd]) {
								inv.equipment[equipmentCategory][itemToAdd] = botFile.inventory.equipment[equipmentCategory][itemToAdd];
							}
						}
					}
					
					// add mods
					for (const modItem in botFile.inventory.mods) {
						if(!inv.mods[modItem]) {
							inv.mods[modItem] = botFile.inventory.mods[modItem];
						}
					}
					
					// replace chances
					for (const chanceCat in botFile.chances) {
						for (const itemChance in botFile.chances[chanceCat]) {
							if (chances[chanceCat][itemChance] === 0 || chances[chanceCat][itemChance] === undefined) {
								chances[chanceCat][itemChance] = botFile.chances[chanceCat][itemChance];
							}
						}
					}
				}
			}
			
		}
	}

	static changeHealth(dbBots, botType, healthValues) {
		if (dbBots[botType].health) {
			dbBots[botType].health.BodyParts = [
				{
					"Chest": {
						"max": healthValues.Thorax,
						"min": healthValues.Thorax
					},
					"Head": {
						"max": healthValues.Head,
						"min": healthValues.Head
					},
					"LeftArm": {
						"max": healthValues.Arms,
						"min": healthValues.Arms
					},
					"LeftLeg": {
						"max": healthValues.Legs,
						"min": healthValues.Legs
					},
					"RightArm": {
						"max": healthValues.Arms,
						"min": healthValues.Arms
					},
					"RightLeg": {
						"max": healthValues.Legs,
						"min": healthValues.Legs
					},
					"Stomach": {
						"max": healthValues.Stomach,
						"min": healthValues.Stomach
					}
				}
			]
		}
	}
}

	
module.exports = { mod: new Mod() }