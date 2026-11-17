// EV makes and models with sensible defaults for battery, DC rate and range
export const EV_CATALOG: Record<string, { models: string[]; defaultBattery: number; defaultDcRate: number; defaultRange: number }> = {
    'Tata': {
        models: ['Nexon.ev', 'Punch.ev', 'Tiago.ev', 'Tigor.ev', 'Curvv.ev', 'Harrier.ev'],
        defaultBattery: 45,
        defaultDcRate: 60,
        defaultRange: 320,
    },
    'Mahindra': {
        models: ['XUV400', 'BE 6e', 'XEV 9e'],
        defaultBattery: 39.4,
        defaultDcRate: 50,
        defaultRange: 310,
    },
    'MG': {
        models: ['ZS EV', 'Comet EV', 'Windsor EV'],
        defaultBattery: 50.3,
        defaultDcRate: 50,
        defaultRange: 340,
    },
    'Hyundai': {
        models: ['IONIQ 5', 'Kona Electric', 'Creta Electric'],
        defaultBattery: 72.6,
        defaultDcRate: 230,
        defaultRange: 450,
    },
    'Kia': {
        models: ['EV6', 'EV9'],
        defaultBattery: 77.4,
        defaultDcRate: 240,
        defaultRange: 480,
    },
    'BYD': {
        models: ['Atto 3', 'Seal', 'e6', 'Sealion 6'],
        defaultBattery: 60.5,
        defaultDcRate: 80,
        defaultRange: 420,
    },
    'BMW': {
        models: ['i4', 'iX1', 'iX', 'i7', 'i5'],
        defaultBattery: 83.9,
        defaultDcRate: 205,
        defaultRange: 490,
    },
    'Mercedes-Benz': {
        models: ['EQB', 'EQE', 'EQS', 'EQA'],
        defaultBattery: 70.5,
        defaultDcRate: 100,
        defaultRange: 425,
    },
    'Audi': {
        models: ['Q8 e-tron', 'e-tron GT', 'Q4 e-tron'],
        defaultBattery: 95,
        defaultDcRate: 170,
        defaultRange: 440,
    },
    'Volvo': {
        models: ['XC40 Recharge', 'C40 Recharge', 'EX30', 'EX90'],
        defaultBattery: 78,
        defaultDcRate: 150,
        defaultRange: 418,
    },
    'Tesla': {
        models: ['Model 3', 'Model Y', 'Model S', 'Model X'],
        defaultBattery: 75,
        defaultDcRate: 250,
        defaultRange: 500,
    },
    'Porsche': {
        models: ['Taycan', 'Macan EV'],
        defaultBattery: 93.4,
        defaultDcRate: 270,
        defaultRange: 450,
    },
    'Other': {
        models: ['Custom EV Model'],
        defaultBattery: 50,
        defaultDcRate: 60,
        defaultRange: 300,
    },
};
