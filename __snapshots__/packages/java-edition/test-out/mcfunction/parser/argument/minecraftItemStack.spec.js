exports['mcfunction argument minecraft:item_stack Parse "minecraft:stick" 1'] = {
  "node": {
    "type": "mcfunction:item_stack",
    "range": {
      "start": 0,
      "end": 15
    },
    "id": {
      "type": "resource_location",
      "range": {
        "start": 0,
        "end": 15
      },
      "namespace": "minecraft",
      "path": [
        "stick"
      ]
    }
  },
  "errors": []
}

exports['mcfunction argument minecraft:item_stack Parse "stick" 1'] = {
  "node": {
    "type": "mcfunction:item_stack",
    "range": {
      "start": 0,
      "end": 5
    },
    "id": {
      "type": "resource_location",
      "range": {
        "start": 0,
        "end": 5
      },
      "path": [
        "stick"
      ]
    }
  },
  "errors": []
}

exports['mcfunction argument minecraft:item_stack Parse "stick{foo:bar}" 1'] = {
  "node": {
    "type": "mcfunction:item_stack",
    "range": {
      "start": 0,
      "end": 14
    },
    "id": {
      "type": "resource_location",
      "range": {
        "start": 0,
        "end": 5
      },
      "path": [
        "stick"
      ]
    },
    "nbt": {
      "type": "nbt:compound",
      "range": {
        "start": 5,
        "end": 14
      },
      "children": [
        {
          "type": "pair",
          "range": {
            "start": 6,
            "end": 13
          },
          "children": [
            {
              "type": "nbt:string",
              "range": {
                "start": 6,
                "end": 9
              },
              "value": "foo",
              "valueMap": [
                {
                  "inner": {
                    "start": 0,
                    "end": 0
                  },
                  "outer": {
                    "start": 6,
                    "end": 6
                  }
                }
              ]
            },
            {
              "type": "nbt:string",
              "range": {
                "start": 10,
                "end": 13
              },
              "value": "bar",
              "valueMap": [
                {
                  "inner": {
                    "start": 0,
                    "end": 0
                  },
                  "outer": {
                    "start": 10,
                    "end": 10
                  }
                }
              ]
            }
          ],
          "key": {
            "type": "nbt:string",
            "range": {
              "start": 6,
              "end": 9
            },
            "value": "foo",
            "valueMap": [
              {
                "inner": {
                  "start": 0,
                  "end": 0
                },
                "outer": {
                  "start": 6,
                  "end": 6
                }
              }
            ]
          },
          "sep": {
            "start": 9,
            "end": 10
          },
          "value": {
            "type": "nbt:string",
            "range": {
              "start": 10,
              "end": 13
            },
            "value": "bar",
            "valueMap": [
              {
                "inner": {
                  "start": 0,
                  "end": 0
                },
                "outer": {
                  "start": 10,
                  "end": 10
                }
              }
            ]
          }
        }
      ]
    }
  },
  "errors": []
}
