import { useUI } from '../../../store/ui';
import { VibePicker } from '../controls/VibePicker';
import { WallpaperPicker } from '../controls/WallpaperPicker';
import { Row, SettingsGroup } from './parts';

export function AppearanceSection() {
  const advanced = useUI((state) => state.advanced);

  return (
    <div className="settings-section">
      <VibePicker />
      <WallpaperPicker />

      <SettingsGroup title="Look" description="Theme, colour, and how the scene sits behind the glass.">
        <Row path="appearance.theme" />
        <Row path="appearance.accent" />
        <Row path="appearance.wallpaperFit" />
        <Row path="appearance.wallpaperDim" />
        <Row path="appearance.wallpaperBlur" />
        <Row path="appearance.wallpaperSaturation" />
        <Row path="appearance.timeShift" />
      </SettingsGroup>

      <SettingsGroup title="Atmosphere" description="The small optical details that make the stage feel alive.">
        <Row path="appearance.effects.grain" />
        <Row path="appearance.effects.vignette" />
        <Row path="appearance.effects.glow" />
        <Row path="appearance.effects.drift" />
        <Row path="appearance.effects.parallax" />
      </SettingsGroup>

      <SettingsGroup title="Material & motion" description="One glass intensity controls blur, fill, border, and shadow together.">
        <Row path="appearance.glassIntensity" />
        <Row path="appearance.radius" />
        <Row path="appearance.density" />
        <Row path="appearance.readabilityBoost" />
        <Row path="appearance.motion" />
      </SettingsGroup>

      <SettingsGroup
        title="Advanced surfaces"
        description="Opt in per surface when you want the search, tiles, or dock to feel different from the rest."
        advanced
        visible={advanced}
      >
        <Row path="advanced.overrides.search" />
        <Row path="advanced.overrides.shortcuts" />
        <Row path="advanced.overrides.dock" />
      </SettingsGroup>
    </div>
  );
}
