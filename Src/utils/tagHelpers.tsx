/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Accessibility,
  ArrowUpDown,
  Car,
  DoorOpen,
  EyeOff,
  MoveHorizontal,
  Sparkles,
  UserCheck,
  VolumeX,
  Tag,
} from 'lucide-react';

export function getTagIcon(tagName: string): React.ReactNode {
  const normalized = tagName.toLowerCase();
  const iconProps = { className: 'w-4 h-4 shrink-0', 'aria-hidden': true };

  if (normalized.includes('wheelchair') || normalized.includes('accessible entrance')) {
    return <Accessibility {...iconProps} />;
  }
  if (normalized.includes('ramp')) {
    return <DoorOpen {...iconProps} />;
  }
  if (normalized.includes('restroom') || normalized.includes('bathroom') || normalized.includes('toilet')) {
    return <Sparkles {...iconProps} />;
  }
  if (normalized.includes('quiet') || normalized.includes('sensory')) {
    return <VolumeX {...iconProps} />;
  }
  if (normalized.includes('braille') || normalized.includes('signage')) {
    return <EyeOff {...iconProps} />;
  }
  if (normalized.includes('elevator') || normalized.includes('lift')) {
    return <ArrowUpDown {...iconProps} />;
  }
  if (normalized.includes('wide') || normalized.includes('aisle') || normalized.includes('pathway')) {
    return <MoveHorizontal {...iconProps} />;
  }
  if (normalized.includes('parking')) {
    return <Car {...iconProps} />;
  }
  if (normalized.includes('staff') || normalized.includes('assistance')) {
    return <UserCheck {...iconProps} />;
  }

  return <Tag {...iconProps} />;
}
