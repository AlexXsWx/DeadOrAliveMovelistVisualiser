var data = {

    "meta": {
        "character": "rig",
        "version": "1.04 (steam)",
        "complete": [ "moves" ],
        "abbreviations": {
            "TLC": "Turn Leg Cut",
            "BND": "Bending Stance",
            "SS": "Side step",
            "BT": "Back turned",
            "STD": "Facing foe"
        },
        "defaults": {
            "criticalDamage": 28,
            "knockBack": 0,
            "groundAttack": false,
            "tracking": false,
            "juggleFinisher": false
        }
    },

    "data": {

        "[STD]": {

            "P": {
                "meta": {
                    "frames": [ 10, 2, 15 ],
                    "actionType": "strike",
                    "strikeType": "punch",
                    "heightClass": "high",
                    "damage": 10,
                    "reach": 1.34,
                    "followUp": [ 12, 23 ],
                    "advantage": {
                        "block": -2,
                        "hit": -2,
                        "counter": 0,
                        "hiCounter": 34,
                        "stun": 34
                    }
                },
                "P": {
                    "4": { "": "TLC" },
                    "P": {
                        "K": { "": "BND" },
                        "2K": {},
                        "4K": {}
                    },
                    "K": {
                        "K": { "": "BND" },
                        "6K": {
                            "4": { "": "BND" }
                        },
                        "2K": {}
                    },
                    "2K": { "K": {} }
                },
                "K": {
                    "K": {},
                    "2K": {}
                },
                "6P": {}
            },
            "9P": { "P": {} },
            "8P": {},
            "7P": {},
            "6P": {
                "P": { "": "BT" },
                "K": {},
                "2K": {
                    "": "BND",
                    "K": { "": "BND" }
                }
            },
            "4P": {
                "P": {},
                "K": {}
            },

            "3P": {},
            "2P": {},
            "1P": { "P": {} },
            "66P": {},

            "K": {
                "": "BND",
                "K": {
                    "": "BND",
                    "4": { "": "TLC" },
                    "K": {
                        "4": { "": "BND" },
                        "6K": {
                            "4": { "": "BND" }
                        }
                    }
                },
                "6K": { "K": {} },
                "2K": {
                    "": "BND",
                    "K": { "": "BND" }
                }
            },
            "9K": { "": "BND" },
            "8K": { "K": {} },
            "7K": {
                "K": { "": "BT" }
            },
            "6K": {
                "K": {
                    "4": { "": "TLC" }
                },
                "9K": { "": "BND" }
            },
            "4K": {
                "": "BND",
                "K": { "": "BND" }
            },
            "3K": {
                "K": { "": "BND" },
                "6K": {
                    "4": { "": "BND" }
                },
                "2K": {
                    "": "BND",
                    "K": { "": "BND" }
                }
            },
            "2K": {
                "K": {},
                "2K": {}
            },
            "1K": {
                "": "BND",
                "K": { "": "BND" }
            },
            "66K": {},
            "44K": { "": "BT" },
            "33K": {},
            "236K": { "": "BND" },
            "214K": {},

            "P+K": { "K": {} },
            "6P+K": {
                "meta": { "actionType": "other" },
                "": "TLC"
            },
            "4P+K": {
                "meta": { "actionType": "other" },
                "": "BND"
            },
            "2P+K": {
                "meta": { "actionType": "other" },
                "": "BND"
            },
            "1P+K": {},

            "H+K": {
                "K": {},
                "2K": {}
            },
            "6H+K": {},

            "2H+K": {},
            "1H+K": {},
            "33H+K": {},

            "Ap": {},
            "6Ap": {},

            "T": {},
            "6T": {},
            "66T": {},
            "41236T": {},
            "2T": {},

            "7H": {},
            "6H": {},
            "4H": {},
            "1H": {},
            "46H": {}
        },

        "[SS]": {
            "P": {},
            "K": {}
        },

        "[BT]": {
            "P": {},
            "7P": { "": "BT" },
            "4P": {},
            "2P": {},
            "K": {
                "K": {},
                "2K": {}
            },
            "4K": {},
            "2K": {},
            "P+K": {
                "meta": { "actionType": "other" },
                "": "TLC"
            },
            "H+K": {}
        },

        "[BND]": {
            "P": {},
            "K": {
                "": "BND",
                "K": {
                    "": "BND",
                    "K": {
                        "4": { "": "TLC" }
                    },
                    "6K": {}
                }
            },
            "8K": {},
            "7K": {},
            "6K": {
                "4": { "": "BND" }
            },
            "4K": {
                "": "BND",
                "K": { "": "BND" }
            },
            "3K": {
                "4": { "": "BND" },
                "6K": {
                    "4": { "": "BND" }
                }
            },
            "2K": {
                "": "BND",
                "K": { "": "BND" }
            },
            "P+K": {},
            "6P+K": {
                "meta": { "actionType": "other" },
                "": "TLC"
            },
            "H+K": {},
            "6H+K": {
                "": "BND",
                "K": { "": "BT" }
            },
            "4H+K": {},
            "2H+K": {},
            "T": { "": "BND" },
            "H": {}
        },

        "[TLC]": {
            "": "BND",
            "P": {},
            "K": {
                "K": {
                    "K": {},
                    "4K": {}
                },
                "H+K": {}
            },
            "6K": {
                "6K": {
                    "6K": {},
                    "K": {}
                },
                "K": {}
            },
            "2K": {},
            "H+K": {},
            "6H+K": {}
        },

        "[BND]/[BT]": {
            "": "BT",
            "P": {},
            "4P": {},
            "2P": {},
            "K": {},
            "2K": {},
            "P+K": {
                "meta": { "actionType": "other" },
                "": "BND"
            },
            "H+K": {}
        }
    }
};