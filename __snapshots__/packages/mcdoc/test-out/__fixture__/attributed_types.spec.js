exports['mcdoc __fixture__ attributed types 1'] = {
  "global": {
    "mcdoc": {
      "::test": {
        "subcategory": "module",
        "definition": [
          {
            "uri": "file:///test.mcdoc",
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
      "::test::NoValue": {
        "data": {
          "typeDef": {
            "kind": "attributed",
            "attribute": {
              "name": "deprecated"
            },
            "child": {
              "kind": "boolean"
            }
          }
        },
        "subcategory": "type_alias",
        "definition": [
          {
            "uri": "file:///test.mcdoc",
            "range": {
              "start": 5,
              "end": 12
            },
            "posRange": {
              "start": {
                "line": 0,
                "character": 5
              },
              "end": {
                "line": 0,
                "character": 12
              }
            },
            "fullRange": {
              "start": 0,
              "end": 37
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
      },
      "::test::SimpleValue": {
        "data": {
          "typeDef": {
            "kind": "attributed",
            "attribute": {
              "name": "since",
              "value": {
                "kind": "literal",
                "value": {
                  "kind": "double",
                  "value": 1.19
                }
              }
            },
            "child": {
              "kind": "boolean"
            }
          }
        },
        "subcategory": "type_alias",
        "definition": [
          {
            "uri": "file:///test.mcdoc",
            "range": {
              "start": 42,
              "end": 53
            },
            "posRange": {
              "start": {
                "line": 1,
                "character": 5
              },
              "end": {
                "line": 1,
                "character": 16
              }
            },
            "fullRange": {
              "start": 37,
              "end": 78
            },
            "fullPosRange": {
              "start": {
                "line": 1,
                "character": 0
              },
              "end": {
                "line": 2,
                "character": 0
              }
            },
            "contributor": "binder"
          }
        ]
      },
      "::test::TreeValue": {
        "data": {
          "typeDef": {
            "kind": "attributed",
            "attribute": {
              "name": "id",
              "value": {
                "kind": "tree",
                "values": {
                  "registry": {
                    "kind": "literal",
                    "value": {
                      "kind": "string",
                      "value": "worldgen/biome"
                    }
                  },
                  "tags": {
                    "kind": "reference",
                    "path": "::test::allowed"
                  }
                }
              }
            },
            "child": {
              "kind": "string"
            }
          }
        },
        "subcategory": "type_alias",
        "definition": [
          {
            "uri": "file:///test.mcdoc",
            "range": {
              "start": 83,
              "end": 92
            },
            "posRange": {
              "start": {
                "line": 2,
                "character": 5
              },
              "end": {
                "line": 2,
                "character": 14
              }
            },
            "fullRange": {
              "start": 78,
              "end": 148
            },
            "fullPosRange": {
              "start": {
                "line": 2,
                "character": 0
              },
              "end": {
                "line": 3,
                "character": 0
              }
            },
            "contributor": "binder"
          }
        ]
      },
      "::test::EnumValue": {
        "data": {
          "typeDef": {
            "kind": "attributed",
            "attribute": {
              "name": "bitfield",
              "value": {
                "kind": "tree",
                "values": {
                  "0": {
                    "kind": "enum",
                    "enumKind": "int",
                    "values": [
                      {
                        "identifier": "HandAll",
                        "value": 1
                      },
                      {
                        "identifier": "BootsAll",
                        "value": 2
                      }
                    ]
                  }
                }
              }
            },
            "child": {
              "kind": "int"
            }
          }
        },
        "subcategory": "type_alias",
        "definition": [
          {
            "uri": "file:///test.mcdoc",
            "range": {
              "start": 153,
              "end": 162
            },
            "posRange": {
              "start": {
                "line": 3,
                "character": 5
              },
              "end": {
                "line": 3,
                "character": 14
              }
            },
            "fullRange": {
              "start": 148,
              "end": 224
            },
            "fullPosRange": {
              "start": {
                "line": 3,
                "character": 0
              },
              "end": {
                "line": 6,
                "character": 7
              }
            },
            "contributor": "binder"
          }
        ]
      },
      "::test::<anonymous 0>": {
        "data": {
          "typeDef": {
            "kind": "enum",
            "enumKind": "int",
            "values": [
              {
                "identifier": "HandAll",
                "value": 1
              },
              {
                "identifier": "BootsAll",
                "value": 2
              }
            ]
          }
        },
        "subcategory": "enum",
        "definition": [
          {
            "uri": "file:///test.mcdoc",
            "range": {
              "start": 176,
              "end": 180
            },
            "posRange": {
              "start": {
                "line": 3,
                "character": 28
              },
              "end": {
                "line": 3,
                "character": 32
              }
            },
            "contributor": "binder"
          }
        ]
      }
    }
  },
  "nodes": {
    "file:///test.mcdoc": {
      "type": "file",
      "range": {
        "start": 0,
        "end": 224
      },
      "children": [
        {
          "type": "mcdoc:module",
          "children": [
            {
              "type": "mcdoc:type_alias",
              "children": [
                {
                  "type": "mcdoc:literal",
                  "range": {
                    "start": 0,
                    "end": 4
                  },
                  "value": "type",
                  "colorTokenType": "keyword"
                },
                {
                  "type": "mcdoc:identifier",
                  "range": {
                    "start": 5,
                    "end": 12
                  },
                  "value": "NoValue",
                  "symbol": {
                    "category": "mcdoc",
                    "path": [
                      "::test::NoValue"
                    ]
                  }
                },
                {
                  "type": "mcdoc:type/boolean",
                  "children": [
                    {
                      "type": "mcdoc:attribute",
                      "children": [
                        {
                          "type": "mcdoc:identifier",
                          "range": {
                            "start": 17,
                            "end": 27
                          },
                          "value": "deprecated"
                        }
                      ],
                      "range": {
                        "start": 15,
                        "end": 28
                      }
                    },
                    {
                      "type": "mcdoc:literal",
                      "range": {
                        "start": 29,
                        "end": 36
                      },
                      "value": "boolean",
                      "colorTokenType": "type"
                    }
                  ],
                  "range": {
                    "start": 15,
                    "end": 37
                  }
                }
              ],
              "range": {
                "start": 0,
                "end": 37
              }
            },
            {
              "type": "mcdoc:type_alias",
              "children": [
                {
                  "type": "mcdoc:literal",
                  "range": {
                    "start": 37,
                    "end": 41
                  },
                  "value": "type",
                  "colorTokenType": "keyword"
                },
                {
                  "type": "mcdoc:identifier",
                  "range": {
                    "start": 42,
                    "end": 53
                  },
                  "value": "SimpleValue",
                  "symbol": {
                    "category": "mcdoc",
                    "path": [
                      "::test::SimpleValue"
                    ]
                  }
                },
                {
                  "type": "mcdoc:type/boolean",
                  "children": [
                    {
                      "type": "mcdoc:attribute",
                      "children": [
                        {
                          "type": "mcdoc:identifier",
                          "range": {
                            "start": 58,
                            "end": 63
                          },
                          "value": "since"
                        },
                        {
                          "type": "mcdoc:type/literal",
                          "children": [
                            {
                              "type": "mcdoc:typed_number",
                              "children": [
                                {
                                  "type": "float",
                                  "range": {
                                    "start": 64,
                                    "end": 68
                                  },
                                  "value": 1.19
                                }
                              ],
                              "range": {
                                "start": 64,
                                "end": 68
                              }
                            }
                          ],
                          "range": {
                            "start": 64,
                            "end": 68
                          }
                        }
                      ],
                      "range": {
                        "start": 56,
                        "end": 70
                      }
                    },
                    {
                      "type": "mcdoc:literal",
                      "range": {
                        "start": 70,
                        "end": 77
                      },
                      "value": "boolean",
                      "colorTokenType": "type"
                    }
                  ],
                  "range": {
                    "start": 56,
                    "end": 78
                  }
                }
              ],
              "range": {
                "start": 37,
                "end": 78
              }
            },
            {
              "type": "mcdoc:type_alias",
              "children": [
                {
                  "type": "mcdoc:literal",
                  "range": {
                    "start": 78,
                    "end": 82
                  },
                  "value": "type",
                  "colorTokenType": "keyword"
                },
                {
                  "type": "mcdoc:identifier",
                  "range": {
                    "start": 83,
                    "end": 92
                  },
                  "value": "TreeValue",
                  "symbol": {
                    "category": "mcdoc",
                    "path": [
                      "::test::TreeValue"
                    ]
                  }
                },
                {
                  "type": "mcdoc:type/string",
                  "children": [
                    {
                      "type": "mcdoc:attribute",
                      "children": [
                        {
                          "type": "mcdoc:identifier",
                          "range": {
                            "start": 97,
                            "end": 99
                          },
                          "value": "id"
                        },
                        {
                          "type": "mcdoc:attribute/tree",
                          "range": {
                            "start": 100,
                            "end": 138
                          },
                          "children": [
                            {
                              "type": "mcdoc:attribute/tree/named",
                              "children": [
                                {
                                  "type": "mcdoc:identifier",
                                  "range": {
                                    "start": 100,
                                    "end": 108
                                  },
                                  "value": "registry"
                                },
                                {
                                  "type": "mcdoc:type/literal",
                                  "children": [
                                    {
                                      "type": "string",
                                      "range": {
                                        "start": 109,
                                        "end": 125
                                      },
                                      "value": "worldgen/biome",
                                      "valueMap": [
                                        {
                                          "inner": {
                                            "start": 0,
                                            "end": 0
                                          },
                                          "outer": {
                                            "start": 110,
                                            "end": 110
                                          }
                                        }
                                      ]
                                    }
                                  ],
                                  "range": {
                                    "start": 109,
                                    "end": 125
                                  }
                                },
                                {
                                  "type": "mcdoc:identifier",
                                  "range": {
                                    "start": 126,
                                    "end": 130
                                  },
                                  "value": "tags"
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
                                            "start": 131,
                                            "end": 138
                                          },
                                          "value": "allowed"
                                        }
                                      ],
                                      "range": {
                                        "start": 131,
                                        "end": 138
                                      }
                                    }
                                  ],
                                  "range": {
                                    "start": 131,
                                    "end": 138
                                  }
                                }
                              ],
                              "range": {
                                "start": 100,
                                "end": 138
                              }
                            }
                          ],
                          "delim": "("
                        }
                      ],
                      "range": {
                        "start": 95,
                        "end": 141
                      }
                    },
                    {
                      "type": "mcdoc:literal",
                      "range": {
                        "start": 141,
                        "end": 147
                      },
                      "value": "string",
                      "colorTokenType": "type"
                    }
                  ],
                  "range": {
                    "start": 95,
                    "end": 148
                  }
                }
              ],
              "range": {
                "start": 78,
                "end": 148
              }
            },
            {
              "type": "mcdoc:type_alias",
              "children": [
                {
                  "type": "mcdoc:literal",
                  "range": {
                    "start": 148,
                    "end": 152
                  },
                  "value": "type",
                  "colorTokenType": "keyword"
                },
                {
                  "type": "mcdoc:identifier",
                  "range": {
                    "start": 153,
                    "end": 162
                  },
                  "value": "EnumValue",
                  "symbol": {
                    "category": "mcdoc",
                    "path": [
                      "::test::EnumValue"
                    ]
                  }
                },
                {
                  "type": "mcdoc:type/numeric_type",
                  "children": [
                    {
                      "type": "mcdoc:attribute",
                      "children": [
                        {
                          "type": "mcdoc:identifier",
                          "range": {
                            "start": 167,
                            "end": 175
                          },
                          "value": "bitfield"
                        },
                        {
                          "type": "mcdoc:attribute/tree",
                          "range": {
                            "start": 176,
                            "end": 218
                          },
                          "children": [
                            {
                              "type": "mcdoc:attribute/tree/pos",
                              "children": [
                                {
                                  "type": "mcdoc:enum",
                                  "children": [
                                    {
                                      "type": "mcdoc:literal",
                                      "range": {
                                        "start": 176,
                                        "end": 180
                                      },
                                      "value": "enum",
                                      "colorTokenType": "keyword",
                                      "symbol": {
                                        "category": "mcdoc",
                                        "path": [
                                          "::test::<anonymous 0>"
                                        ]
                                      }
                                    },
                                    {
                                      "type": "mcdoc:literal",
                                      "range": {
                                        "start": 181,
                                        "end": 184
                                      },
                                      "value": "int",
                                      "colorTokenType": "type"
                                    },
                                    {
                                      "type": "mcdoc:enum/block",
                                      "children": [
                                        {
                                          "type": "mcdoc:enum/field",
                                          "children": [
                                            {
                                              "type": "mcdoc:identifier",
                                              "range": {
                                                "start": 189,
                                                "end": 196
                                              },
                                              "value": "HandAll"
                                            },
                                            {
                                              "type": "mcdoc:typed_number",
                                              "children": [
                                                {
                                                  "type": "integer",
                                                  "range": {
                                                    "start": 199,
                                                    "end": 200
                                                  },
                                                  "value": 1
                                                }
                                              ],
                                              "range": {
                                                "start": 199,
                                                "end": 200
                                              }
                                            }
                                          ],
                                          "range": {
                                            "start": 189,
                                            "end": 200
                                          }
                                        },
                                        {
                                          "type": "mcdoc:enum/field",
                                          "children": [
                                            {
                                              "type": "mcdoc:identifier",
                                              "range": {
                                                "start": 203,
                                                "end": 211
                                              },
                                              "value": "BootsAll"
                                            },
                                            {
                                              "type": "mcdoc:typed_number",
                                              "children": [
                                                {
                                                  "type": "integer",
                                                  "range": {
                                                    "start": 214,
                                                    "end": 215
                                                  },
                                                  "value": 2
                                                }
                                              ],
                                              "range": {
                                                "start": 214,
                                                "end": 215
                                              }
                                            }
                                          ],
                                          "range": {
                                            "start": 203,
                                            "end": 215
                                          }
                                        }
                                      ],
                                      "range": {
                                        "start": 186,
                                        "end": 218
                                      }
                                    }
                                  ],
                                  "range": {
                                    "start": 176,
                                    "end": 218
                                  }
                                }
                              ],
                              "range": {
                                "start": 176,
                                "end": 218
                              }
                            }
                          ],
                          "delim": "("
                        }
                      ],
                      "range": {
                        "start": 165,
                        "end": 221
                      }
                    },
                    {
                      "type": "mcdoc:literal",
                      "range": {
                        "start": 221,
                        "end": 224
                      },
                      "value": "int",
                      "colorTokenType": "type"
                    }
                  ],
                  "range": {
                    "start": 165,
                    "end": 224
                  }
                }
              ],
              "range": {
                "start": 148,
                "end": 224
              }
            }
          ],
          "range": {
            "start": 0,
            "end": 224
          }
        }
      ],
      "locals": {},
      "parserErrors": [],
      "binderErrors": []
    }
  }
}
