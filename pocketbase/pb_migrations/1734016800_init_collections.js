// PocketBase migration for LifeCalendar collections
migrate((db) => {
  // Settings collection for app configuration and credentials
  const settings = new Collection({
    "id": "settings",
    "created": "2024-12-12 12:00:00.000Z",
    "updated": "2024-12-12 12:00:00.000Z",
    "name": "settings",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "key",
        "name": "key",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": true,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "value",
        "name": "value",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_settings_key` ON `settings` (`key`)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  // Withings tokens collection
  const withingsTokens = new Collection({
    "id": "withings_tokens",
    "created": "2024-12-12 12:00:00.000Z",
    "updated": "2024-12-12 12:00:00.000Z",
    "name": "withings_tokens",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "user_id",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": true,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "access_token",
        "name": "access_token",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "refresh_token",
        "name": "refresh_token",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "expires_at",
        "name": "expires_at",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_withings_tokens_user_id` ON `withings_tokens` (`user_id`)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  // Metrics cache collection
  const metricsCache = new Collection({
    "id": "metrics_cache",
    "created": "2024-12-12 12:00:00.000Z",
    "updated": "2024-12-12 12:00:00.000Z",
    "name": "metrics_cache",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "user_id",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "date",
        "name": "date",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "steps",
        "name": "steps",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "calories_out",
        "name": "calories_out",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "cardio_minutes",
        "name": "cardio_minutes",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "max_hr",
        "name": "max_hr",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "sleep_hours",
        "name": "sleep_hours",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "workouts",
        "name": "workouts",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": null
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_metrics_cache_user_date` ON `metrics_cache` (`user_id`, `date`)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  // Todos collection
  const todos = new Collection({
    "id": "todos",
    "created": "2024-12-12 12:00:00.000Z",
    "updated": "2024-12-12 12:00:00.000Z",
    "name": "todos",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "user_id",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "date",
        "name": "date",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "text",
        "name": "text",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "done",
        "name": "done",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_todos_user_date` ON `todos` (`user_id`, `date`)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  // Supplements collection
  const supplements = new Collection({
    "id": "supplements",
    "created": "2024-12-12 12:00:00.000Z",
    "updated": "2024-12-12 12:00:00.000Z",
    "name": "supplements",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "user_id",
        "name": "user_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "date",
        "name": "date",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "key",
        "name": "key",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "vitamin_d",
            "omega_3",
            "creatine",
            "magnesium"
          ]
        }
      },
      {
        "system": false,
        "id": "taken",
        "name": "taken",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_supplements_user_date_key` ON `supplements` (`user_id`, `date`, `key`)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(settings)
    .then(() => Dao(db).saveCollection(withingsTokens))
    .then(() => Dao(db).saveCollection(metricsCache))
    .then(() => Dao(db).saveCollection(todos))
    .then(() => Dao(db).saveCollection(supplements));
}, (db) => {
  // Rollback - delete collections
  const collections = ['settings', 'withings_tokens', 'metrics_cache', 'todos', 'supplements'];
  
  return collections.reduce((promise, collectionName) => {
    return promise.then(() => {
      try {
        const collection = Dao(db).findCollectionByNameOrId(collectionName);
        return Dao(db).deleteCollection(collection);
      } catch (e) {
        // Collection might not exist, ignore error
        return Promise.resolve();
      }
    });
  }, Promise.resolve());
});