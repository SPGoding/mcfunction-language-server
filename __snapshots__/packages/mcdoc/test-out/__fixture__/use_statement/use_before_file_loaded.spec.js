exports['mcdoc __fixture__ use statement/use before file loaded 1'] = {
  "global": {
    "mcdoc": {
      "::client": {
        "subcategory": "module",
        "definition": [
          {
            "uri": "file:///client.mcdoc",
            "range": {
              "start": 0,
              "end": 0
            },
            "posRange": {
              "start": {
                "line": 0,
                "character": 0
              },
              "end": {
                "line": 0,
                "character": 0
              }
            },
            "contributor": "uri_binder"
          }
        ],
        "data": {
          "nextAnonymousIndex": 1
        }
      },
      "::later": {
        "subcategory": "module",
        "definition": [
          {
            "uri": "file:///later.mcdoc",
            "range": {
              "start": 0,
              "end": 0
            },
            "posRange": {
              "start": {
                "line": 0,
                "character": 0
              },
              "end": {
                "line": 0,
                "character": 0
              }
            },
            "contributor": "uri_binder"
          }
        ],
        "data": {
          "nextAnonymousIndex": 0
        },
        "reference": [
          {
            "uri": "file:///client.mcdoc",
            "range": {
              "start": 6,
              "end": 11
            },
            "posRange": {
              "start": {
                "line": 0,
                "character": 6
              },
              "end": {
                "line": 0,
                "character": 11
              }
            },
            "fullRange": {
              "start": 6,
              "end": 17
            },
            "fullPosRange": {
              "start": {
                "line": 0,
                "character": 6
              },
              "end": {
                "line": 0,
                "character": 17
              }
            },
            "contributor": "binder",
            "skipRenaming": false
          }
        ]
      },
      "::client::<anonymous 0>": {
        "data": {
          "typeDef": {
            "kind": "struct",
            "fields": [
              {
                "kind": "pair",
                "key": "foo",
                "type": {
                  "kind": "reference",
                  "path": "::later::Used"
                }
              }
            ]
          }
        },
        "subcategory": "struct",
        "definition": [
          {
            "uri": "file:///client.mcdoc",
            "range": {
              "start": 18,
              "end": 24
            },
            "posRange": {
              "start": {
                "line": 1,
                "character": 0
              },
              "end": {
                "line": 1,
                "character": 6
              }
            },
            "contributor": "binder"
          }
        ],
        "members": {
          "foo": {
            "definition": [
              {
                "uri": "file:///client.mcdoc",
                "range": {
                  "start": 27,
                  "end": 30
                },
                "posRange": {
                  "start": {
                    "line": 1,
                    "character": 9
                  },
                  "end": {
                    "line": 1,
                    "character": 12
                  }
                },
                "fullRange": {
                  "start": 27,
                  "end": 37
                },
                "fullPosRange": {
                  "start": {
                    "line": 1,
                    "character": 9
                  },
                  "end": {
                    "line": 1,
                    "character": 19
                  }
                },
                "contributor": "binder"
              }
            ]
          }
        }
      },
      "::later::Used": {
        "data": {
          "typeDef": {
            "kind": "struct",
            "fields": []
          }
        },
        "subcategory": "struct",
        "definition": [
          {
            "uri": "file:///later.mcdoc",
            "range": {
              "start": 7,
              "end": 11
            },
            "posRange": {
              "start": {
                "line": 0,
                "character": 7
              },
              "end": {
                "line": 0,
                "character": 11
              }
            },
            "fullRange": {
              "start": 0,
              "end": 14
            },
            "fullPosRange": {
              "start": {
                "line": 0,
                "character": 0
              },
              "end": {
                "line": 0,
                "character": 14
              }
            },
            "contributor": "binder"
          }
        ],
        "reference": [
          {
            "uri": "file:///client.mcdoc",
            "range": {
              "start": 13,
              "end": 17
            },
            "posRange": {
              "start": {
                "line": 0,
                "character": 13
              },
              "end": {
                "line": 0,
                "character": 17
              }
            },
            "fullRange": {
              "start": 6,
              "end": 17
            },
            "fullPosRange": {
              "start": {
                "line": 0,
                "character": 6
              },
              "end": {
                "line": 0,
                "character": 17
              }
            },
            "contributor": "binder",
            "skipRenaming": false
          },
          {
            "uri": "file:///client.mcdoc",
            "range": {
              "start": 32,
              "end": 36
            },
            "posRange": {
              "start": {
                "line": 1,
                "character": 14
              },
              "end": {
                "line": 1,
                "character": 18
              }
            },
            "fullRange": {
              "start": 32,
              "end": 36
            },
            "fullPosRange": {
              "start": {
                "line": 1,
                "character": 14
              },
              "end": {
                "line": 1,
                "character": 18
              }
            },
            "contributor": "binder",
            "skipRenaming": false
          }
        ]
      }
    }
  },
  "nodes": {
    "file:///client.mcdoc": {
      "type": "file",
      "range": {
        "start": 0,
        "end": 38
      },
      "children": [
        {
          "type": "mcdoc:module",
          "children": [
            {
              "type": "mcdoc:use_statement",
              "children": [
                {
                  "type": "mcdoc:literal",
                  "range": {
                    "start": 0,
                    "end": 3
                  },
                  "value": "use",
                  "colorTokenType": "keyword"
                },
                {
                  "type": "mcdoc:path",
                  "children": [
                    {
                      "type": "mcdoc:identifier",
                      "range": {
                        "start": 6,
                        "end": 11
                      },
                      "value": "later",
                      "symbol": {
                        "category": "mcdoc",
                        "path": [
                          "::later"
                        ]
                      }
                    },
                    {
                      "type": "mcdoc:identifier",
                      "range": {
                        "start": 13,
                        "end": 17
                      },
                      "value": "Used",
                      "symbol": {
                        "category": "mcdoc",
                        "path": [
                          "::later::Used"
                        ]
                      }
                    }
                  ],
                  "range": {
                    "start": 6,
                    "end": 17
                  },
                  "isAbsolute": true
                }
              ],
              "range": {
                "start": 0,
                "end": 18
              }
            },
            {
              "type": "mcdoc:struct",
              "children": [
                {
                  "type": "mcdoc:literal",
                  "range": {
                    "start": 18,
                    "end": 24
                  },
                  "value": "struct",
                  "colorTokenType": "keyword",
                  "symbol": {
                    "category": "mcdoc",
                    "path": [
                      "::client::<anonymous 0>"
                    ]
                  }
                },
                {
                  "type": "mcdoc:struct/block",
                  "children": [
                    {
                      "type": "mcdoc:struct/field/pair",
                      "children": [
                        {
                          "type": "mcdoc:identifier",
                          "range": {
                            "start": 27,
                            "end": 30
                          },
                          "value": "foo",
                          "symbol": {
                            "category": "mcdoc",
                            "path": [
                              "::client::<anonymous 0>",
                              "foo"
                            ]
                          }
                        },
                        {
                          "type": "mcdoc:type/reference",
                          "children": [
                            {
                              "type": "mcdoc:path",
                              "children": [
                                {
                                  "type": "mcdoc:identifier",
                                  "range": {
                                    "start": 32,
                                    "end": 36
                                  },
                                  "value": "Used",
                                  "symbol": {
                                    "category": "mcdoc",
                                    "path": [
                                      "::later::Used"
                                    ]
                                  }
                                }
                              ],
                              "range": {
                                "start": 32,
                                "end": 36
                              }
                            }
                          ],
                          "range": {
                            "start": 32,
                            "end": 37
                          }
                        }
                      ],
                      "range": {
                        "start": 27,
                        "end": 37
                      }
                    }
                  ],
                  "range": {
                    "start": 25,
                    "end": 38
                  }
                }
              ],
              "range": {
                "start": 18,
                "end": 38
              }
            }
          ],
          "range": {
            "start": 0,
            "end": 38
          }
        }
      ],
      "locals": {
        "mcdoc": {
          "::client::Used": {
            "category": "mcdoc",
            "identifier": "::client::Used",
            "path": [
              "::client::Used"
            ],
            "subcategory": "use_statement_binding",
            "visibility": 1,
            "data": {
              "target": [
                "later",
                "Used"
              ]
            },
            "definition": [
              {
                "uri": "file:///client.mcdoc",
                "range": {
                  "start": 13,
                  "end": 17
                },
                "posRange": {
                  "start": {
                    "line": 0,
                    "character": 13
                  },
                  "end": {
                    "line": 0,
                    "character": 17
                  }
                },
                "fullRange": {
                  "start": 0,
                  "end": 18
                },
                "fullPosRange": {
                  "start": {
                    "line": 0,
                    "character": 0
                  },
                  "end": {
                    "line": 1,
                    "character": 0
                  }
                },
                "contributor": "binder"
              }
            ]
          }
        }
      },
      "parserErrors": [],
      "binderErrors": []
    },
    "file:///later.mcdoc": {
      "type": "file",
      "range": {
        "start": 0,
        "end": 14
      },
      "children": [
        {
          "type": "mcdoc:module",
          "children": [
            {
              "type": "mcdoc:struct",
              "children": [
                {
                  "type": "mcdoc:literal",
                  "range": {
                    "start": 0,
                    "end": 6
                  },
                  "value": "struct",
                  "colorTokenType": "keyword"
                },
                {
                  "type": "mcdoc:identifier",
                  "range": {
                    "start": 7,
                    "end": 11
                  },
                  "value": "Used",
                  "symbol": {
                    "category": "mcdoc",
                    "path": [
                      "::later::Used"
                    ]
                  }
                },
                {
                  "type": "mcdoc:struct/block",
                  "children": [],
                  "range": {
                    "start": 12,
                    "end": 14
                  }
                }
              ],
              "range": {
                "start": 0,
                "end": 14
              }
            }
          ],
          "range": {
            "start": 0,
            "end": 14
          }
        }
      ],
      "locals": {},
      "parserErrors": [],
      "binderErrors": []
    }
  }
}
