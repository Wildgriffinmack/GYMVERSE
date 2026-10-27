import type { ImageSourcePropType } from "react-native";

/**
 * DEVELOPMENT PLACEHOLDER PHOTOS — CC0 / public-domain gym images from Wikimedia Commons
 * (sources in assets/demo-photos/CREDITS.md). Replace with real user uploads once media storage exists.
 */
export const PHOTOS: Record<string, { source: ImageSourcePropType; alt: string }> = {
  "gym-rig": { source: require("../../assets/demo-photos/gym-rig.jpg"), alt: "Functional training rig on a gym floor" },
  "gym-machines": { source: require("../../assets/demo-photos/gym-machines.jpg"), alt: "Row of strength machines in a bright gym" },
  "gym-cardio": { source: require("../../assets/demo-photos/gym-cardio.jpg"), alt: "Bikes and treadmills in a gym" },
  "dumbbells-plates": { source: require("../../assets/demo-photos/dumbbells-plates.jpg"), alt: "Two loaded dumbbells and spare plates" },
  "dumbbell-rack": { source: require("../../assets/demo-photos/dumbbell-rack.jpg"), alt: "Rack of hex dumbbells" },
  "deadlift-grip": { source: require("../../assets/demo-photos/deadlift-grip.jpg"), alt: "Hands gripping a barbell before a deadlift" },
  "dumbbells-pair": { source: require("../../assets/demo-photos/dumbbells-pair.jpg"), alt: "Pair of dumbbells on a concrete floor" },
  "dumbbells-floor": { source: require("../../assets/demo-photos/dumbbells-floor.jpg"), alt: "Dumbbells and weight plates on the floor" },
  "gym-floor": { source: require("../../assets/demo-photos/gym-floor.jpg"), alt: "Empty gym floor with a training rig and treadmill" },
  "lifting-platforms": { source: require("../../assets/demo-photos/lifting-platforms.jpg"), alt: "Lifting platforms and racks seen from above" },
};
