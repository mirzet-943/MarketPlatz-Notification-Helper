// Marktplaats Filter Configuration based on API facets
const FILTER_CONFIG = {
    // Construction Year (Bouwjaar)
    constructionYear: {
        key: 'constructionYear',
        label: 'Construction Year',
        type: 'range',
        filterType: 'AttributeRange',
        years: Array.from({length: 2025 - 1900 + 1}, (_, i) => 2025 - i)
    },

    // Fuel Type (Brandstof)
    fuel: {
        key: 'fuel',
        label: 'Fuel Type',
        type: 'multiselect',
        filterType: 'AttributeById',
        options: [
            { id: 473, label: 'Benzine (Gasoline)', key: 'Benzine' },
            { id: 474, label: 'Diesel', key: 'Diesel' },
            { id: 11756, label: 'Elektrisch (Electric)', key: 'Elektrisch' },
            { id: 13838, label: 'Hybride Elektrisch/Benzine', key: 'Hybride ElektrischBenzine' },
            { id: 13839, label: 'Hybride Elektrisch/Diesel', key: 'Hybride ElektrischDiesel' },
            { id: 475, label: 'LPG', key: 'LPG' },
            { id: 13840, label: 'CNG (Aardgas)', key: 'CNG' },
            { id: 13841, label: 'Waterstof (Hydrogen)', key: 'Waterstof' },
            { id: 476, label: 'Overige brandstoffen', key: 'Overige brandstoffen' }
        ]
    },

    // Price Range (Prijs)
    priceRange: {
        key: 'PriceCents',
        label: 'Price Range (EUR)',
        type: 'range',
        filterType: 'AttributeRange',
        min: 0,
        max: 100000,
        step: 1000,
        unit: 'cents' // multiply by 100
    },

    // Mileage (Kilometerstand)
    mileage: {
        key: 'mileage',
        label: 'Mileage (km)',
        type: 'range',
        filterType: 'AttributeRange',
        options: [
            { value: 0, label: '0 km' },
            { value: 10000, label: '10.000 km' },
            { value: 20000, label: '20.000 km' },
            { value: 30000, label: '30.000 km' },
            { value: 50000, label: '50.000 km' },
            { value: 75000, label: '75.000 km' },
            { value: 100000, label: '100.000 km' },
            { value: 150000, label: '150.000 km' },
            { value: 200000, label: '200.000 km' },
            { value: 300000, label: '300.000 km' }
        ]
    },

    // Body Type (Carrosserie)
    body: {
        key: 'body',
        label: 'Body Type',
        type: 'multiselect',
        filterType: 'AttributeById',
        options: [
            { id: 485, label: 'Cabriolet', key: 'Cabriolet' },
            { id: 486, label: 'Coupé', key: 'Coupé' },
            { id: 481, label: 'Hatchback', key: 'Hatchback (3/5-deurs)' },
            { id: 482, label: 'MPV', key: 'MPV' },
            { id: 483, label: 'Sedan', key: 'Sedan (2/4-deurs)' },
            { id: 484, label: 'Stationwagon', key: 'Stationwagon' },
            { id: 488, label: 'SUV or Terreinwagen', key: 'SUV of Terreinwagen' },
            { id: 487, label: 'Other Body Types', key: 'Overige carrosserieën' }
        ]
    },

    // Transmission
    transmission: {
        key: 'transmission',
        label: 'Transmission',
        type: 'multiselect',
        filterType: 'AttributeById',
        options: [
            { id: 534, label: 'Automatic', key: 'Automaat' },
            { id: 535, label: 'Manual', key: 'Handgeschakeld' }
        ]
    },

    // Advertiser Type
    advertiser: {
        key: 'advertiser',
        label: 'Advertiser',
        type: 'multiselect',
        filterType: 'AttributeById',
        options: [
            { id: 10898, label: 'Private (Particulier)', key: 'Particulier' },
            { id: 10899, label: 'Business (Bedrijf)', key: 'Bedrijf' }
        ]
    },

    // Car Brands (L2 Category)
    brand: {
        key: 'l2CategoryId',
        label: 'Brand',
        type: 'select',
        filterType: 'L2CategoryId',
        options: [
            { id: 157, label: 'Volkswagen' },
            { id: 96, label: 'BMW' },
            { id: 130, label: 'Mercedes-Benz' },
            { id: 140, label: 'Peugeot' },
            { id: 112, label: 'Ford' },
            { id: 138, label: 'Opel' },
            { id: 93, label: 'Audi' },
            { id: 146, label: 'Renault' },
            { id: 155, label: 'Toyota' },
            { id: 119, label: 'Kia' },
            { id: 158, label: 'Volvo' },
            { id: 101, label: 'Citroën' },
            { id: 111, label: 'Fiat' },
            { id: 150, label: 'Seat' },
            { id: 115, label: 'Hyundai' },
            { id: 151, label: 'Skoda' },
            { id: 133, label: 'Mini' },
            { id: 135, label: 'Nissan' },
            { id: 154, label: 'Suzuki' },
            { id: 129, label: 'Mazda' },
            { id: 95, label: 'Bestelauto\'s' },
            { id: 124, label: 'Land Rover' },
            { id: 144, label: 'Porsche' },
            { id: 134, label: 'Mitsubishi' },
            { id: 2660, label: 'Dacia' },
            { id: 92, label: 'Alfa Romeo' },
            { id: 118, label: 'Jeep' },
            { id: 2830, label: 'Tesla' },
            { id: 3211, label: 'Lynk & Co' },
            { id: 3051, label: 'Cupra' }
        ].sort((a, b) => a.label.localeCompare(b.label))
    },

    // Location (Postcode)
    postcode: {
        key: 'postcode',
        label: 'Postcode',
        type: 'text',
        filterType: 'Postcode',
        placeholder: 'e.g., 1012AB'
    },

    // Search Query
    query: {
        key: 'query',
        label: 'Search Keywords',
        type: 'text',
        filterType: 'Query',
        placeholder: 'e.g., volkswagen golf'
    }
};

// Default required filters
const DEFAULT_FILTERS = [
    { filterType: 'AttributeById', key: 'offeredSince', value: '0' }, // Required
    { filterType: 'AttributeByKey', key: 'offeredSince', value: 'offeredSince:Vandaag' }, // Always
    { filterType: 'L1CategoryId', key: 'l1CategoryId', value: '91' } // Cars category
];
