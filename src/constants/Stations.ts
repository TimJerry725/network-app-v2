export type Connector = {
    id: string;
    chargerId?: string; // e.g. "CP1233"
    gunLabel?: string;  // e.g. "Gun 1"
    type: 'CCS2' | 'Type 2' | 'CHAdeMO' | 'GB/T';
    currentType?: 'AC' | 'DC';
    power: number;
    status: 'Available' | 'Busy' | 'Maintenance' | 'Preparing';
    pricePerKWh: number;
    waitMinutes: number;
};

export type Station = {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    connectors: Connector[];
    amenities: string[];
    openTime: string;
    closeTime: string;
    image: string;
    galleryImages?: string[];
    accessType?: 'Public' | 'Private' | 'Restricted';
    rating: number;
    distanceKm: number;
    etaMinutes: number;
    rewardBoost: number;
    occupancyLabel: 'Calm' | 'Balanced' | 'Busy';
    tagline: string;
};

const CONNECTOR_COMPATIBILITY: Record<Connector['type'], Connector['type'][]> = {
    CCS2: ['CCS2', 'Type 2'],
    'Type 2': ['Type 2'],
    CHAdeMO: ['CHAdeMO'],
    'GB/T': ['GB/T'],
};

export const MOCK_STATIONS: Station[] = [
    {
        id: 'cbe-casagrand-01',
        name: 'Casa Grand Techno City',
        address: 'Peelamedu, Coimbatore, Tamil Nadu, India - 641 023',
        latitude: 11.0268,
        longitude: 77.0152,
        accessType: 'Public',
        openTime: '6:00 AM',
        closeTime: '9:30 PM',
        distanceKm: 43,
        etaMinutes: 60,
        rating: 4.8,
        rewardBoost: 25,
        occupancyLabel: 'Balanced',
        tagline: 'Dual CP1233 high-speed charging plaza with restaurant & hotel amenities',
        amenities: ['Restaurant', 'Hotel', 'Washroom'],
        image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1000',
        galleryImages: [
            'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1558441719-7d885a5a7b63?auto=format&fit=crop&q=80&w=600',
        ],
        connectors: [
            { id: 'CP1233-G1', chargerId: 'CP1233', gunLabel: 'Gun 1', type: 'CCS2', currentType: 'DC', power: 60, status: 'Preparing', pricePerKWh: 10.00, waitMinutes: 0 },
            { id: 'CP1233-G2', chargerId: 'CP1233', gunLabel: 'Gun 2', type: 'CCS2', currentType: 'DC', power: 60, status: 'Available', pricePerKWh: 10.00, waitMinutes: 0 },
            { id: 'CP1234-G1', chargerId: 'CP1234', gunLabel: 'Gun 1', type: 'CCS2', currentType: 'DC', power: 60, status: 'Preparing', pricePerKWh: 10.00, waitMinutes: 5 },
            { id: 'CP1234-G2', chargerId: 'CP1234', gunLabel: 'Gun 2', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 10.00, waitMinutes: 0 },
        ],
    },
    {
        id: 'cbe-sp-01',
        name: 'Iris Saravanampatti Hub',
        address: 'Saravanampatti, Coimbatore, TN 641035, India',
        latitude: 11.0797,
        longitude: 76.9989,
        connectors: [
            { id: 'SP-01', type: 'CCS2', power: 150, status: 'Available', pricePerKWh: 18.00, waitMinutes: 0 },
            { id: 'SP-02', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 14.00, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'WiFi', 'Restroom'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1000',
        rating: 4.7,
        distanceKm: 2.1,
        etaMinutes: 8,
        rewardBoost: 25,
        occupancyLabel: 'Calm',
        tagline: 'Reliable fast charging in Saravanampatti tech corridor',
    },
    {
        id: '1',
        name: 'Iris Mumbai Hub',
        address: 'Bandra Kurla Complex, Mumbai, MH 400051, India',
        latitude: 19.0631,
        longitude: 72.8687,
        connectors: [
            { id: 'IM-01', type: 'CCS2', power: 180, status: 'Available', pricePerKWh: 21.00, waitMinutes: 0 },
            { id: 'IM-02', type: 'CCS2', power: 180, status: 'Busy', pricePerKWh: 21.00, waitMinutes: 8 },
            { id: 'IM-03', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 15.00, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Restroom', 'WiFi', 'Lounge'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1000',
        rating: 4.8,
        distanceKm: 1.6,
        etaMinutes: 7,
        rewardBoost: 35,
        occupancyLabel: 'Calm',
        tagline: 'Fast central Mumbai top-up with lounge seating',
    },
    {
        id: '2',
        name: 'Delhi Connaught Charge Plaza',
        address: 'Connaught Place, New Delhi, DL 110001, India',
        latitude: 28.6315,
        longitude: 77.2167,
        connectors: [
            { id: 'DC-04', type: 'CCS2', power: 120, status: 'Available', pricePerKWh: 18.50, waitMinutes: 0 },
            { id: 'DC-05', type: 'CHAdeMO', power: 90, status: 'Available', pricePerKWh: 17.50, waitMinutes: 0 },
        ],
        amenities: ['Mall', 'Food Court', 'WiFi'],
        openTime: '06:00',
        closeTime: '23:00',
        image: 'https://images.unsplash.com/photo-1646700517865-c7e09cd42da3?auto=format&fit=crop&q=80&w=1000',
        rating: 4.3,
        distanceKm: 8.4,
        etaMinutes: 18,
        rewardBoost: 24,
        occupancyLabel: 'Balanced',
        tagline: 'Good central stop for errands while charging',
    },
    {
        id: '3',
        name: 'Pune Expressway Gateway',
        address: 'Mumbai-Pune Expressway, Lonavala, MH 410401, India',
        latitude: 18.7513,
        longitude: 73.4045,
        connectors: [
            { id: 'PE-06', type: 'CCS2', power: 320, status: 'Available', pricePerKWh: 24.50, waitMinutes: 0 },
            { id: 'PE-07', type: 'CCS2', power: 320, status: 'Available', pricePerKWh: 24.50, waitMinutes: 0 },
            { id: 'PE-08', type: 'Type 2', power: 22, status: 'Maintenance', pricePerKWh: 14.50, waitMinutes: 0 },
        ],
        amenities: ['Restroom', 'Convenience Store', 'Coffee'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?auto=format&fit=crop&q=80&w=1000',
        rating: 4.9,
        distanceKm: 96,
        etaMinutes: 76,
        rewardBoost: 48,
        occupancyLabel: 'Calm',
        tagline: 'Ultra-fast highway stop for longer legs',
    },
    {
        id: '4',
        name: 'Bengaluru Tech Park Charge',
        address: 'Electronic City, Bengaluru, KA 560100, India',
        latitude: 12.8399,
        longitude: 77.6770,
        connectors: [
            { id: 'BT-09', type: 'CCS2', power: 150, status: 'Available', pricePerKWh: 19.50, waitMinutes: 2 },
            { id: 'BT-10', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 13.50, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'WiFi', 'Restroom'],
        openTime: '05:00',
        closeTime: '23:30',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000',
        rating: 4.5,
        distanceKm: 64,
        etaMinutes: 54,
        rewardBoost: 19,
        occupancyLabel: 'Balanced',
        tagline: 'Reliable stop with quick highway access',
    },
    {
        id: '5',
        name: 'Hyderabad Jubilee Hills Rapid',
        address: 'Jubilee Hills, Hyderabad, TS 500033, India',
        latitude: 17.4326,
        longitude: 78.4071,
        connectors: [
            { id: 'HJ-11', type: 'CCS2', power: 90, status: 'Available', pricePerKWh: 18.00, waitMinutes: 0 },
            { id: 'HJ-12', type: 'CHAdeMO', power: 60, status: 'Busy', pricePerKWh: 16.50, waitMinutes: 7 },
        ],
        amenities: ['Coffee', 'Food Court', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=1000',
        rating: 4.1,
        distanceKm: 3.4,
        etaMinutes: 10,
        rewardBoost: 26,
        occupancyLabel: 'Busy',
        tagline: 'Quick city stop when you need a short refill',
    },
    {
        id: '6',
        name: 'Chennai ECR Fast Hub',
        address: 'East Coast Road, Chennai, TN 600041, India',
        latitude: 12.9667,
        longitude: 80.2583,
        connectors: [
            { id: 'CE-13', type: 'CCS2', power: 240, status: 'Available', pricePerKWh: 22.00, waitMinutes: 0 },
            { id: 'CE-14', type: 'CCS2', power: 180, status: 'Available', pricePerKWh: 20.00, waitMinutes: 0 },
            { id: 'CE-15', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 14.00, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Restroom', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1617458048447-3b4d3b05a796?auto=format&fit=crop&q=80&w=1000',
        rating: 4.7,
        distanceKm: 81,
        etaMinutes: 66,
        rewardBoost: 27,
        occupancyLabel: 'Calm',
        tagline: 'High-speed coastal hub with low queue risk',
    },
    {
        id: '7',
        name: 'Ahmedabad SG Highway Charge',
        address: 'SG Highway, Ahmedabad, GJ 380015, India',
        latitude: 23.0305,
        longitude: 72.5178,
        connectors: [
            { id: 'AS-16', type: 'CCS2', power: 150, status: 'Available', pricePerKWh: 19.00, waitMinutes: 3 },
            { id: 'AS-17', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 13.00, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Lounge', 'WiFi', 'Grocery'],
        openTime: '05:30',
        closeTime: '23:30',
        image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1000',
        rating: 4.6,
        distanceKm: 102,
        etaMinutes: 79,
        rewardBoost: 21,
        occupancyLabel: 'Balanced',
        tagline: 'Comfort stop for Gujarat journeys',
    },
    {
        id: '8',
        name: 'Jaipur NH48 Hyper Hub',
        address: 'NH48, Jaipur Highway, RJ 302001, India',
        latitude: 26.8530,
        longitude: 75.7130,
        connectors: [
            { id: 'JH-18', type: 'CCS2', power: 300, status: 'Available', pricePerKWh: 23.50, waitMinutes: 0 },
            { id: 'JH-19', type: 'CCS2', power: 150, status: 'Busy', pricePerKWh: 21.00, waitMinutes: 6 },
            { id: 'JH-20', type: 'CHAdeMO', power: 90, status: 'Available', pricePerKWh: 18.00, waitMinutes: 0 },
        ],
        amenities: ['Food Court', 'Restroom', 'WiFi', 'Lounge'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&q=80&w=1000',
        rating: 4.8,
        distanceKm: 191,
        etaMinutes: 143,
        rewardBoost: 42,
        occupancyLabel: 'Calm',
        tagline: 'Best stop for maximum charging speed on NH48',
    },
    {
        id: '9',
        name: 'Kolkata Salt Lake Charge',
        address: 'Salt Lake City, Kolkata, WB 700064, India',
        latitude: 22.5804,
        longitude: 88.4042,
        connectors: [
            { id: 'KS-21', type: 'CCS2', power: 180, status: 'Available', pricePerKWh: 19.50, waitMinutes: 1 },
            { id: 'KS-22', type: 'CHAdeMO', power: 80, status: 'Available', pricePerKWh: 16.50, waitMinutes: 0 },
            { id: 'KS-23', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 13.50, waitMinutes: 0 },
        ],
        amenities: ['Mall', 'Food Court', 'Restroom', 'Coffee'],
        openTime: '07:00',
        closeTime: '22:00',
        image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=1000',
        rating: 4.4,
        distanceKm: 164,
        etaMinutes: 122,
        rewardBoost: 28,
        occupancyLabel: 'Balanced',
        tagline: 'Solid family break with food and retail nearby',
    },
    {
        id: '10',
        name: 'Goa Coastal Charge',
        address: 'Calangute, Goa, GA 403516, India',
        latitude: 15.5494,
        longitude: 73.7535,
        connectors: [
            { id: 'GC-24', type: 'CCS2', power: 120, status: 'Available', pricePerKWh: 20.00, waitMinutes: 0 },
            { id: 'GC-25', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 15.00, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Restroom', 'WiFi', 'Boardwalk'],
        openTime: '06:00',
        closeTime: '23:00',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1000',
        rating: 4.5,
        distanceKm: 191,
        etaMinutes: 145,
        rewardBoost: 25,
        occupancyLabel: 'Balanced',
        tagline: 'Easy coastal stop with walkable coffee and views',
    },
    {
        id: '11',
        name: 'Navi Mumbai Charge House',
        address: 'Vashi, Navi Mumbai, MH 400703, India',
        latitude: 19.0745,
        longitude: 72.9978,
        connectors: [
            { id: 'NM-26', type: 'CCS2', power: 180, status: 'Available', pricePerKWh: 20.50, waitMinutes: 0 },
            { id: 'NM-27', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 14.50, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Lounge', 'Restroom', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1000',
        rating: 4.7,
        distanceKm: 33,
        etaMinutes: 45,
        rewardBoost: 30,
        occupancyLabel: 'Calm',
        tagline: 'Comfort-first stop before city drives',
    },
    {
        id: '12',
        name: 'Chandigarh Highway Superhub',
        address: 'Ambala-Chandigarh Expy, Zirakpur, PB 140603, India',
        latitude: 30.6329,
        longitude: 76.8227,
        connectors: [
            { id: 'CH-28', type: 'CCS2', power: 250, status: 'Available', pricePerKWh: 21.50, waitMinutes: 0 },
            { id: 'CH-29', type: 'CCS2', power: 180, status: 'Available', pricePerKWh: 19.00, waitMinutes: 1 },
            { id: 'CH-30', type: 'CHAdeMO', power: 100, status: 'Available', pricePerKWh: 17.00, waitMinutes: 0 },
        ],
        amenities: ['Restroom', 'Convenience Store', 'Coffee', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000',
        rating: 4.7,
        distanceKm: 313,
        etaMinutes: 226,
        rewardBoost: 36,
        occupancyLabel: 'Calm',
        tagline: 'Fast northbound stop toward Punjab and HP',
    },
    {
        id: '13',
        name: 'Gurgaon Cyber City Hub',
        address: 'Cyber City, Gurugram, HR 122002, India',
        latitude: 28.4901,
        longitude: 77.0888,
        connectors: [
            { id: 'GC-31', type: 'CCS2', power: 320, status: 'Available', pricePerKWh: 24.00, waitMinutes: 0 },
            { id: 'GC-32', type: 'CCS2', power: 180, status: 'Available', pricePerKWh: 21.00, waitMinutes: 0 },
            { id: 'GC-33', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 15.00, waitMinutes: 0 },
        ],
        amenities: ['Lounge', 'Food Court', 'Restroom', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&q=80&w=1000',
        rating: 4.8,
        distanceKm: 26,
        etaMinutes: 40,
        rewardBoost: 45,
        occupancyLabel: 'Calm',
        tagline: 'Ultra-fast NCR stop with plenty of food options',
    },
    {
        id: '14',
        name: 'Mysuru Connector Plaza',
        address: 'Bengaluru-Mysuru Expy, KA 570001, India',
        latitude: 12.3051,
        longitude: 76.6406,
        connectors: [
            { id: 'MC-34', type: 'CCS2', power: 150, status: 'Available', pricePerKWh: 18.50, waitMinutes: 2 },
            { id: 'MC-35', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 13.50, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Restroom', 'Grocery', 'WiFi'],
        openTime: '05:00',
        closeTime: '23:00',
        image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&q=80&w=1000',
        rating: 4.4,
        distanceKm: 171,
        etaMinutes: 126,
        rewardBoost: 19,
        occupancyLabel: 'Balanced',
        tagline: 'Easy top-up before longer expressway legs',
    },
    {
        id: '15',
        name: 'Kochi Marina Rapid',
        address: 'Marine Drive, Kochi, KL 682031, India',
        latitude: 9.9774,
        longitude: 76.2753,
        connectors: [
            { id: 'KM-36', type: 'CCS2', power: 180, status: 'Available', pricePerKWh: 20.00, waitMinutes: 0 },
            { id: 'KM-37', type: 'Type 2', power: 22, status: 'Available', pricePerKWh: 14.00, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Restroom', 'Lounge', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&q=80&w=1000',
        rating: 4.7,
        distanceKm: 65,
        etaMinutes: 110,
        rewardBoost: 31,
        occupancyLabel: 'Calm',
        tagline: 'Strong destination charger for Kerala arrivals',
    },
    {
        id: '16',
        name: 'Lucknow Riverside Charge',
        address: 'Gomti Nagar, Lucknow, UP 226010, India',
        latitude: 26.8467,
        longitude: 80.9461,
        connectors: [
            { id: 'LR-38', type: 'CCS2', currentType: 'DC', power: 180, status: 'Available', pricePerKWh: 21.00, waitMinutes: 0 },
            { id: 'LR-39', type: 'CCS2', currentType: 'DC', power: 120, status: 'Busy', pricePerKWh: 19.50, waitMinutes: 9 },
            { id: 'LR-40', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 13.50, waitMinutes: 0 },
        ],
        amenities: ['Restroom', 'Coffee', 'Lounge', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1517821365201-7734f463f1a0?auto=format&fit=crop&q=80&w=1000',
        rating: 4.6,
        distanceKm: 68,
        etaMinutes: 105,
        rewardBoost: 34,
        occupancyLabel: 'Balanced',
        tagline: 'Reliable UP charger for long-distance arrivals',
    },
    {
        id: 'tn-avinashi-01',
        name: 'Iris Avinashi Highway Plaza',
        address: 'NH544 Bypass, Avinashi, Tiruppur, TN 641654, India',
        latitude: 11.1920,
        longitude: 77.2686,
        connectors: [
            { id: 'AV-01', chargerId: 'CP1240', type: 'CCS2', currentType: 'DC', power: 120, status: 'Available', pricePerKWh: 16.00, waitMinutes: 0 },
            { id: 'AV-02', chargerId: 'CP1240', type: 'CCS2', currentType: 'DC', power: 60, status: 'Available', pricePerKWh: 14.00, waitMinutes: 0 },
            { id: 'AV-03', chargerId: 'CP1241', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 11.00, waitMinutes: 0 },
        ],
        amenities: ['Restaurant', 'Washroom', 'Coffee', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1000',
        rating: 4.8,
        distanceKm: 42,
        etaMinutes: 35,
        rewardBoost: 30,
        occupancyLabel: 'Calm',
        tagline: 'Quick highway breakfast & fast DC charge on NH544',
    },
    {
        id: 'tn-erode-01',
        name: 'Iris Erode Chithode Hub',
        address: 'Chithode NH544 Junction, Erode, TN 638102, India',
        latitude: 11.3850,
        longitude: 77.6845,
        connectors: [
            { id: 'ER-01', chargerId: 'CP1245', type: 'CCS2', currentType: 'DC', power: 150, status: 'Available', pricePerKWh: 17.00, waitMinutes: 0 },
            { id: 'ER-02', chargerId: 'CP1245', type: 'CCS2', currentType: 'DC', power: 60, status: 'Available', pricePerKWh: 15.00, waitMinutes: 0 },
        ],
        amenities: ['Food Court', 'Restroom', 'Coffee', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000',
        rating: 4.7,
        distanceKm: 98,
        etaMinutes: 75,
        rewardBoost: 28,
        occupancyLabel: 'Calm',
        tagline: 'Spacious highway food court with dual ultra-fast guns',
    },
    {
        id: 'tn-salem-01',
        name: 'Salem NH44 Grand EV Superhub',
        address: 'AVR Roundana, NH44, Salem, TN 636005, India',
        latitude: 11.6643,
        longitude: 78.1460,
        connectors: [
            { id: 'SL-01', chargerId: 'CP1250', type: 'CCS2', currentType: 'DC', power: 180, status: 'Available', pricePerKWh: 18.00, waitMinutes: 0 },
            { id: 'SL-02', chargerId: 'CP1250', type: 'CCS2', currentType: 'DC', power: 120, status: 'Available', pricePerKWh: 16.50, waitMinutes: 0 },
            { id: 'SL-03', chargerId: 'CP1251', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 12.00, waitMinutes: 0 },
        ],
        amenities: ['Restaurant', 'Hotel', 'Restroom', 'Lounge', 'Cafe'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1558441719-7d885a5a7b63?auto=format&fit=crop&q=80&w=1000',
        rating: 4.9,
        distanceKm: 165,
        etaMinutes: 125,
        rewardBoost: 40,
        occupancyLabel: 'Calm',
        tagline: 'Top-rated midway stop between Coimbatore and Bengaluru/Chennai',
    },
    {
        id: 'tn-dharmapuri-01',
        name: 'Dharmapuri Highway Oasis',
        address: 'Thoppur-Dharmapuri NH44 Stretch, TN 636701, India',
        latitude: 12.1211,
        longitude: 78.1582,
        connectors: [
            { id: 'DH-01', chargerId: 'CP1260', type: 'CCS2', currentType: 'DC', power: 120, status: 'Available', pricePerKWh: 15.50, waitMinutes: 0 },
            { id: 'DH-02', chargerId: 'CP1260', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 11.50, waitMinutes: 0 },
        ],
        amenities: ['Coffee', 'Restroom', 'Restaurant'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1000',
        rating: 4.6,
        distanceKm: 230,
        etaMinutes: 175,
        rewardBoost: 25,
        occupancyLabel: 'Calm',
        tagline: 'Peaceful coffee & washroom break after Thoppur ghat',
    },
    {
        id: 'tn-krishnagiri-01',
        name: 'Krishnagiri Tollway HyperCharge',
        address: 'Chennai-Bengaluru NH48 Junction, Krishnagiri, TN 635001, India',
        latitude: 12.5186,
        longitude: 78.2137,
        connectors: [
            { id: 'KR-01', chargerId: 'CP1270', type: 'CCS2', currentType: 'DC', power: 240, status: 'Available', pricePerKWh: 19.00, waitMinutes: 0 },
            { id: 'KR-02', chargerId: 'CP1270', type: 'CCS2', currentType: 'DC', power: 120, status: 'Available', pricePerKWh: 17.00, waitMinutes: 0 },
            { id: 'KR-03', chargerId: 'CP1271', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 12.50, waitMinutes: 0 },
        ],
        amenities: ['Food Court', 'Restroom', 'Lounge', 'Coffee', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000',
        rating: 4.9,
        distanceKm: 280,
        etaMinutes: 210,
        rewardBoost: 45,
        occupancyLabel: 'Balanced',
        tagline: '240 kW ultra-fast highway junction for Bengaluru & Chennai',
    },
    {
        id: 'tn-hosur-01',
        name: 'Iris Hosur Gateway Plaza',
        address: 'Sipcot Phase II, NH44, Hosur, TN 635109, India',
        latitude: 12.7409,
        longitude: 77.8253,
        connectors: [
            { id: 'HS-01', chargerId: 'CP1280', type: 'CCS2', currentType: 'DC', power: 180, status: 'Available', pricePerKWh: 17.50, waitMinutes: 0 },
            { id: 'HS-02', chargerId: 'CP1280', type: 'CCS2', currentType: 'DC', power: 60, status: 'Available', pricePerKWh: 14.50, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Restroom', 'WiFi', 'Restaurant'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1558441719-7d885a5a7b63?auto=format&fit=crop&q=80&w=1000',
        rating: 4.8,
        distanceKm: 315,
        etaMinutes: 235,
        rewardBoost: 32,
        occupancyLabel: 'Calm',
        tagline: 'Fast top-up right before entering Bengaluru city traffic',
    },
    {
        id: 'tn-vellore-01',
        name: 'Vellore NH48 Midway Express',
        address: 'Pallikonda Toll Plaza, NH48, Vellore, TN 632001, India',
        latitude: 12.9165,
        longitude: 79.1325,
        connectors: [
            { id: 'VL-01', chargerId: 'CP1290', type: 'CCS2', currentType: 'DC', power: 180, status: 'Available', pricePerKWh: 18.00, waitMinutes: 0 },
            { id: 'VL-02', chargerId: 'CP1290', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 12.00, waitMinutes: 0 },
        ],
        amenities: ['Restaurant', 'Restroom', 'Coffee', 'WiFi'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1000',
        rating: 4.8,
        distanceKm: 215,
        etaMinutes: 165,
        rewardBoost: 35,
        occupancyLabel: 'Calm',
        tagline: 'Ideal midway fast charger between Bengaluru and Chennai',
    },
    {
        id: 'tn-ulundurpet-01',
        name: 'Ulundurpet Grand Highway Hub',
        address: 'Trichy-Chennai NH38, Ulundurpet, TN 606107, India',
        latitude: 11.6912,
        longitude: 79.2901,
        connectors: [
            { id: 'UL-01', chargerId: 'CP1295', type: 'CCS2', currentType: 'DC', power: 150, status: 'Available', pricePerKWh: 16.50, waitMinutes: 0 },
            { id: 'UL-02', chargerId: 'CP1295', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 11.50, waitMinutes: 0 },
        ],
        amenities: ['Restaurant', 'Restroom', 'Coffee'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000',
        rating: 4.7,
        distanceKm: 295,
        etaMinutes: 220,
        rewardBoost: 30,
        occupancyLabel: 'Calm',
        tagline: 'Convenient family dining & charging on Coimbatore-Chennai route',
    },
    {
        id: 'tn-mettupalayam-01',
        name: 'Mettupalayam Foothills EV Base',
        address: 'Ooty Main Road, Mettupalayam, TN 641301, India',
        latitude: 11.2997,
        longitude: 76.9366,
        connectors: [
            { id: 'MP-01', chargerId: 'CP1301', type: 'CCS2', currentType: 'DC', power: 120, status: 'Available', pricePerKWh: 16.00, waitMinutes: 0 },
            { id: 'MP-02', chargerId: 'CP1301', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 11.00, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Restroom', 'Lounge'],
        openTime: '24/7',
        closeTime: '24/7',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1000',
        rating: 4.9,
        distanceKm: 38,
        etaMinutes: 45,
        rewardBoost: 35,
        occupancyLabel: 'Calm',
        tagline: 'Essential 90%+ top-up point before climbing Ooty hairpin bends',
    },
    {
        id: 'tn-coonoor-01',
        name: 'Coonoor Valley View Charge',
        address: 'Sim’s Park Road, Coonoor, Nilgiris, TN 643101, India',
        latitude: 11.3530,
        longitude: 76.7959,
        connectors: [
            { id: 'CN-01', chargerId: 'CP1305', type: 'CCS2', currentType: 'DC', power: 60, status: 'Available', pricePerKWh: 17.50, waitMinutes: 0 },
            { id: 'CN-02', chargerId: 'CP1305', type: 'Type 2', currentType: 'AC', power: 22, status: 'Available', pricePerKWh: 12.00, waitMinutes: 0 },
        ],
        amenities: ['Cafe', 'Restroom', 'Hotel'],
        openTime: '06:00 AM',
        closeTime: '10:00 PM',
        image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&q=80&w=1000',
        rating: 4.8,
        distanceKm: 68,
        etaMinutes: 105,
        rewardBoost: 30,
        occupancyLabel: 'Calm',
        tagline: 'Scenic tea-estate fast charger on the way to Ooty',
    },
];

export function isConnectorCompatible(
    connectorType: Connector['type'],
    vehicleConnectorType?: Connector['type']
) {
    if (!vehicleConnectorType) {
        return true;
    }

    return CONNECTOR_COMPATIBILITY[vehicleConnectorType].includes(connectorType);
}

export function getStationById(stationId?: string) {
    return MOCK_STATIONS.find((station) => station.id === stationId);
}

export function getAvailableConnectors(station: Station) {
    return station.connectors.filter((connector) => connector.status === 'Available');
}

export function getCompatibleConnectors(
    station: Station,
    preferredType?: Connector['type']
) {
    const availableConnectors = getAvailableConnectors(station).filter((connector) =>
        isConnectorCompatible(connector.type, preferredType)
    );

    return availableConnectors.sort((left, right) => {
        const leftExactMatch = left.type === preferredType ? 1 : 0;
        const rightExactMatch = right.type === preferredType ? 1 : 0;

        if (leftExactMatch !== rightExactMatch) {
            return rightExactMatch - leftExactMatch;
        }

        if (left.power !== right.power) {
            return right.power - left.power;
        }

        return left.pricePerKWh - right.pricePerKWh;
    });
}

export function getRecommendedConnector(
    station: Station,
    preferredType?: Connector['type']
) {
    return (
        getCompatibleConnectors(station, preferredType)[0] ??
        getAvailableConnectors(station)[0] ??
        station.connectors[0]
    );
}

export function findStationByConnector(connectorId?: string) {
    if (!connectorId) {
        return undefined;
    }

    for (const station of MOCK_STATIONS) {
        const connector = station.connectors.find((item) => item.id === connectorId);

        if (connector) {
            return { station, connector };
        }
    }

    return undefined;
}
