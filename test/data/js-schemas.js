module.exports = [{
    'firstName': String,
    'lastName': String(''),
    '?email': '',
    'rates': [Number],
    'addresses': Array.of({
        'street': String,
        'city': String,
        '?country': {
            code: String,
            name: String
        }
    })
}, [{
    'firstName': String,
    'lastName': String(''),
    '?email': '',
    'rates': [Number],
    'addresses': Array.of({
        'street': String,
        'city': String,
        '?country': {
            code: String,
            name: String
        }
    })
}]];
