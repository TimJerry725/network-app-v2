import { ImageSourcePropType } from 'react-native';

/**
 * Car photos by model.
 * Only one photo exists today, so every model uses it. To give a model its own photo,
 * add the file to assets/images/cars/ and add a line here, for example:
 *   'Tata Nexon.ev': require('../../assets/images/cars/tata-nexon-ev.webp'),
 */
const DEFAULT_CAR: ImageSourcePropType = require('../../assets/images/profile-car.webp');

const MODEL_IMAGES: Record<string, ImageSourcePropType> = {
    // 'Hyundai IONIQ 5': require('../../assets/images/cars/hyundai-ioniq-5.webp'),
};

export function getCarImage(make?: string, model?: string): ImageSourcePropType {
    if (!make || !model) return DEFAULT_CAR;
    return MODEL_IMAGES[`${make} ${model}`] ?? DEFAULT_CAR;
}
