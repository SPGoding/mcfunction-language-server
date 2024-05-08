exports['mcfunction argument minecraft:game_profile Parse "0123" 1'] = {
  "node": {
    "type": "mcfunction:entity",
    "range": {
      "start": 0,
      "end": 4
    },
    "children": [
      {
        "type": "string",
        "range": {
          "start": 0,
          "end": 4
        },
        "value": "0123",
        "valueMap": [
          {
            "inner": {
              "start": 0,
              "end": 0
            },
            "outer": {
              "start": 0,
              "end": 0
            }
          }
        ]
      }
    ],
    "playerName": {
      "type": "string",
      "range": {
        "start": 0,
        "end": 4
      },
      "value": "0123",
      "valueMap": [
        {
          "inner": {
            "start": 0,
            "end": 0
          },
          "outer": {
            "start": 0,
            "end": 0
          }
        }
      ]
    }
  },
  "errors": []
}

exports['mcfunction argument minecraft:game_profile Parse "@e" 1'] = {
  "node": {
    "type": "mcfunction:entity",
    "range": {
      "start": 0,
      "end": 2
    },
    "children": [
      {
        "type": "mcfunction:entity_selector",
        "range": {
          "start": 0,
          "end": 2
        },
        "children": [
          {
            "type": "literal",
            "range": {
              "start": 0,
              "end": 2
            },
            "value": "@e"
          }
        ],
        "variable": "e",
        "currentEntity": false,
        "playersOnly": false,
        "predicates": [
          "Entity::isAlive"
        ],
        "single": false,
        "typeLimited": false,
        "hover": "**Performance**: 🤢\n- `chunkLimited`: `false`\n- `dimensionLimited`: `false`\n- `playersOnly`: `false`\n- `typeLimited`: `false`\n\n------\n**Predicates**:\n- `Entity::isAlive`"
      }
    ],
    "selector": {
      "type": "mcfunction:entity_selector",
      "range": {
        "start": 0,
        "end": 2
      },
      "children": [
        {
          "type": "literal",
          "range": {
            "start": 0,
            "end": 2
          },
          "value": "@e"
        }
      ],
      "variable": "e",
      "currentEntity": false,
      "playersOnly": false,
      "predicates": [
        "Entity::isAlive"
      ],
      "single": false,
      "typeLimited": false,
      "hover": "**Performance**: 🤢\n- `chunkLimited`: `false`\n- `dimensionLimited`: `false`\n- `playersOnly`: `false`\n- `typeLimited`: `false`\n\n------\n**Predicates**:\n- `Entity::isAlive`"
    }
  },
  "errors": [
    {
      "range": {
        "start": 0,
        "end": 2
      },
      "message": "The selector contains non-player entities",
      "severity": 3
    }
  ]
}

exports['mcfunction argument minecraft:game_profile Parse "Player" 1'] = {
  "node": {
    "type": "mcfunction:entity",
    "range": {
      "start": 0,
      "end": 6
    },
    "children": [
      {
        "type": "string",
        "range": {
          "start": 0,
          "end": 6
        },
        "value": "Player",
        "valueMap": [
          {
            "inner": {
              "start": 0,
              "end": 0
            },
            "outer": {
              "start": 0,
              "end": 0
            }
          }
        ]
      }
    ],
    "playerName": {
      "type": "string",
      "range": {
        "start": 0,
        "end": 6
      },
      "value": "Player",
      "valueMap": [
        {
          "inner": {
            "start": 0,
            "end": 0
          },
          "outer": {
            "start": 0,
            "end": 0
          }
        }
      ]
    }
  },
  "errors": []
}

exports['mcfunction argument minecraft:game_profile Parse "dd12be42-52a9-4a91-a8a1-11c01849e498" 1'] = {
  "node": {
    "type": "mcfunction:entity",
    "range": {
      "start": 0,
      "end": 36
    },
    "children": [
      {
        "type": "mcfunction:uuid",
        "range": {
          "start": 0,
          "end": 36
        },
        "bits": [
          "-2516740049682740591",
          "-6295731287348353896"
        ]
      }
    ],
    "uuid": {
      "type": "mcfunction:uuid",
      "range": {
        "start": 0,
        "end": 36
      },
      "bits": [
        "-2516740049682740591",
        "-6295731287348353896"
      ]
    }
  },
  "errors": [
    {
      "range": {
        "start": 0,
        "end": 36
      },
      "message": "The selector contains non-player entities",
      "severity": 3
    }
  ]
}
