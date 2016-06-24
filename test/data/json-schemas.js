module.exports = [{
    "name": "",
    "type": "object",
    "properties": {
        "firstName": {
            "name": "firstName",
            "type": "string",
            "required": true,
            "default": "",
            "validate": () => true
        },
        "lastName": {
            "name": "lastName",
            "type": "string",
            "required": true,
            "default": ""
        },
        "email": {
            "name": "email",
            "type": "string",
            "required": false,
            "default": "",
            "validate": "email"
        },
        "rates": {
            "name": "rates",
            "type": "array",
            "items": {
                "name": "",
                "type": "number",
                "default": 0
            },
            "required": true,
            "default": []
        },
        "addresses": {
            "name": "addresses",
            "type": "array",
            "items": {
                "name": "",
                "type": "object",
                "properties": {
                    "street": {
                        "name": "street",
                        "type": "string",
                        "required": true,
                        "default": ""
                    },
                    "city": {
                        "name": "city",
                        "type": "string",
                        "required": true,
                        "default": ""
                    },
                    "country": {
                        "name": "country",
                        "type": "object",
                        "properties": {
                            "code": {
                                "name": "code",
                                "type": "string",
                                "required": true,
                                "default": ""
                            },
                            "name": {
                                "name": "name",
                                "type": "string",
                                "required": true,
                                "default": ""
                            }
                        },
                        "required": false,
                        "default": {}
                    }
                }
            },
            "required": true,
            "default": []
        }
    }
}, {
    "name": "",
    "type": "array",
    "items": {
        "name": "",
        "type": "object",
        "properties": {
            "firstName": {
                "name": "firstName",
                "type": "string",
                "required": true,
                "default": ""
            },
            "lastName": {
                "name": "lastName",
                "type": "string",
                "required": true,
                "default": ""
            },
            "email": {
                "name": "email",
                "type": "string",
                "required": false,
                "default": ""
            },
            "rates": {
                "name": "rates",
                "type": "array",
                "items": {
                    "name": "",
                    "type": "number",
                    "default": 0
                },
                "required": true,
                "default": []
            },
            "addresses": {
                "name": "addresses",
                "type": "array",
                "items": {
                    "name": "",
                    "type": "object",
                    "properties": {
                        "street": {
                            "name": "street",
                            "type": "string",
                            "required": true,
                            "default": ""
                        },
                        "city": {
                            "name": "city",
                            "type": "string",
                            "required": true,
                            "default": ""
                        },
                        "country": {
                            "name": "country",
                            "type": "object",
                            "properties": {
                                "code": {
                                    "name": "code",
                                    "type": "string",
                                    "required": true,
                                    "default": ""
                                },
                                "name": {
                                    "name": "name",
                                    "type": "string",
                                    "required": true,
                                    "default": ""
                                }
                            },
                            "required": false,
                            "default": {}
                        }
                    }
                },
                "required": true,
                "default": []
            }
        }
    }
}];