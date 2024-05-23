exports['mcdoc __fixture__ struct/simple 1'] = {
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
          "nextAnonymousIndex": 0
        }
      },
      "::test::Simple": {
        "data": {
          "typeDef": {
            "kind": "struct",
            "fields": [
              {
                "kind": "pair",
                "key": "Foo",
                "type": {
                  "kind": "byte"
                }
              },
              {
                "kind": "pair",
                "attributes": [
                  {
                    "name": "since",
                    "value": {
                      "kind": "literal",
                      "value": {
                        "kind": "double",
                        "value": 1.19
                      }
                    }
                  }
                ],
                "key": "Bar",
                "type": {
                  "kind": "string",
                  "attributes": [
                    {
                      "name": "id"
                    }
                  ]
                },
                "optional": true
              }
            ]
          }
        },
        "subcategory": "struct",
        "definition": [
          {
            "uri": "file:///test.mcdoc",
            "range": {
              "start": 7,
              "end": 13
            },
            "posRange": {
              "start": {
                "line": 0,
                "character": 7
              },
              "end": {
                "line": 0,
                "character": 13
              }
            },
            "fullRange": {
              "start": 0,
              "end": 65
            },
            "fullPosRange": {
              "start": {
                "line": 0,
                "character": 0
              },
              "end": {
                "line": 4,
                "character": 1
              }
            },
            "contributor": "binder"
          }
        ],
        "members": {
          "Foo": {
            "definition": [
              {
                "uri": "file:///test.mcdoc",
                "range": {
                  "start": 17,
                  "end": 20
                },
                "posRange": {
                  "start": {
                    "line": 1,
                    "character": 1
                  },
                  "end": {
                    "line": 1,
                    "character": 4
                  }
                },
                "fullRange": {
                  "start": 17,
                  "end": 26
                },
                "fullPosRange": {
                  "start": {
                    "line": 1,
                    "character": 1
                  },
                  "end": {
                    "line": 1,
                    "character": 10
                  }
                },
                "contributor": "binder"
              }
            ]
          },
          "Bar": {
            "definition": [
              {
                "uri": "file:///test.mcdoc",
                "range": {
                  "start": 44,
                  "end": 47
                },
                "posRange": {
                  "start": {
                    "line": 3,
                    "character": 1
                  },
                  "end": {
                    "line": 3,
                    "character": 4
                  }
                },
                "fullRange": {
                  "start": 29,
                  "end": 62
                },
                "fullPosRange": {
                  "start": {
                    "line": 2,
                    "character": 1
                  },
                  "end": {
                    "line": 3,
                    "character": 19
                  }
                },
                "contributor": "binder"
              }
            ]
          }
        }
      }
    }
  },
  "nodes": {
    "file:///test.mcdoc": {
      "type": "file",
      "range": {
        "start": 0,
        "end": 65
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
                    "end": 13
                  },
                  "value": "Simple",
                  "symbol": {
                    "category": "mcdoc",
                    "path": [
                      "::test::Simple"
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
                            "start": 17,
                            "end": 20
                          },
                          "value": "Foo",
                          "symbol": {
                            "category": "mcdoc",
                            "path": [
                              "::test::Simple",
                              "Foo"
                            ]
                          }
                        },
                        {
                          "type": "mcdoc:type/numeric_type",
                          "children": [
                            {
                              "type": "mcdoc:literal",
                              "range": {
                                "start": 22,
                                "end": 26
                              },
                              "value": "byte",
                              "colorTokenType": "type"
                            }
                          ],
                          "range": {
                            "start": 22,
                            "end": 26
                          }
                        }
                      ],
                      "range": {
                        "start": 17,
                        "end": 26
                      }
                    },
                    {
                      "type": "mcdoc:struct/field/pair",
                      "children": [
                        {
                          "type": "mcdoc:attribute",
                          "children": [
                            {
                              "type": "mcdoc:identifier",
                              "range": {
                                "start": 31,
                                "end": 36
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
                                        "start": 37,
                                        "end": 41
                                      },
                                      "value": 1.19
                                    }
                                  ],
                                  "range": {
                                    "start": 37,
                                    "end": 41
                                  }
                                }
                              ],
                              "range": {
                                "start": 37,
                                "end": 41
                              }
                            }
                          ],
                          "range": {
                            "start": 29,
                            "end": 44
                          }
                        },
                        {
                          "type": "mcdoc:identifier",
                          "range": {
                            "start": 44,
                            "end": 47
                          },
                          "value": "Bar",
                          "symbol": {
                            "category": "mcdoc",
                            "path": [
                              "::test::Simple",
                              "Bar"
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
                                    "start": 52,
                                    "end": 54
                                  },
                                  "value": "id"
                                }
                              ],
                              "range": {
                                "start": 50,
                                "end": 55
                              }
                            },
                            {
                              "type": "mcdoc:literal",
                              "range": {
                                "start": 56,
                                "end": 62
                              },
                              "value": "string",
                              "colorTokenType": "type"
                            }
                          ],
                          "range": {
                            "start": 50,
                            "end": 62
                          }
                        }
                      ],
                      "range": {
                        "start": 29,
                        "end": 62
                      },
                      "isOptional": true
                    }
                  ],
                  "range": {
                    "start": 14,
                    "end": 65
                  }
                }
              ],
              "range": {
                "start": 0,
                "end": 65
              }
            }
          ],
          "range": {
            "start": 0,
            "end": 65
          }
        }
      ],
      "locals": {},
      "parserErrors": [],
      "binderErrors": []
    }
  }
}
