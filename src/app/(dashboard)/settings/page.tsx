'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useIsDesktop } from '@/hooks/use-media-query';
import { MOBILE_SETTINGS_TABS } from '@/lib/mobile-app';
import { SettingsRail } from '@/components/settings/settings-rail';
import { SettingsOverview } from '@/components/settings/settings-overview';
import { ProfileForm } from '@/components/settings/profile-form';
import { SecurityPanel } from '@/components/settings/security-panel';
import { AppearancePanel } from '@/components/settings/appearance-panel';
import { WhatsAppConfig } from '@/components/settings/whatsapp-config';
import { TemplateManager } from '@/components/settings/template-manager';
import { FieldsAndTagsPanel } from '@/components/settings/fields-and-tags-panel';
import { DealsSettings } from '@/components/settings/deals-settings';
import { MembersTab } from '@/components/settings/members-tab';
import { ApiKeysSettings } from '@/components/settings/api-keys-settings';
import { AiSettingsPanel } from '@/components/settings/ai-settings';
import { PrivacyPanel } from '@/components/settings/privacy-panel';
import {
  resolveSection,
  type SettingsSection,
} from '@/components/settings/settings-sections';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { defaultCurrency } = useAuth();
  const { mode } = useTheme();
  const desktop = useIsDesktop();

  const section = resolveSection(searchParams.get('tab'));
  const active: SettingsSection =
    !desktop && !MOBILE_SETTINGS_TABS.has(section) ? 'profile' : section;

  const go = (next: SettingsSection) => {
    if (!desktop && !MOBILE_SETTINGS_TABS.has(next)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  };

  const hints: Partial<Record<SettingsSection, ReactNode>> = useMemo(
    () => ({
      appearance: mode.charAt(0).toUpperCase() + mode.slice(1),
      deals: defaultCurrency,
    }),
    [mode, defaultCurrency],
  );

  const panel: Record<SettingsSection, ReactNode> = {
    overview: <SettingsOverview onSelect={go} />,
    profile: <ProfileForm />,
    security: <SecurityPanel />,
    appearance: <AppearancePanel />,
    whatsapp: <WhatsAppConfig />,
    templates: <TemplateManager />,
    fields: <FieldsAndTagsPanel />,
    deals: <DealsSettings />,
    ai: <AiSettingsPanel />,
    privacy: <PrivacyPanel />,
    members: <MembersTab />,
    api: <ApiKeysSettings />,
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {desktop ? 'Configurações' : 'Perfil'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {desktop
            ? 'Tudo em um só lugar — sua conta e seu espaço de trabalho. Escolha uma seção para gerenciá-la.'
            : 'Nome, WhatsApp de avisos e aparência. Funil, WhatsApp Business e o resto ficam no computador.'}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[236px_minmax(0,1fr)] lg:items-start">
        <SettingsRail
          active={active}
          onSelect={go}
          hints={hints}
          allowed={desktop ? undefined : MOBILE_SETTINGS_TABS}
        />
        <div className="min-w-0">{panel[active]}</div>
      </div>
    </div>
  );
}
