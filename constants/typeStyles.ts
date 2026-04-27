export const TYPE_STYLES: Record<string, { bg: string; border: string; badge: string; badgeText: string }> = {
  fire:     { bg: '#FFF0EB', border: '#fdd5c5', badge: '#FF4422', badgeText: '#fff' },
  water:    { bg: '#EBF4FF', border: '#c5ddf9', badge: '#3399FF', badgeText: '#fff' },
  grass:    { bg: '#EDFFF0', border: '#d0f0d5', badge: '#44BB55', badgeText: '#fff' },
  electric: { bg: '#FFFCE0', border: '#f5eaa0', badge: '#FFCC00', badgeText: '#7a5f00' },
  psychic:  { bg: '#FFF0F6', border: '#f5c0d8', badge: '#FF5599', badgeText: '#fff' },
  ice:      { bg: '#EDFAFF', border: '#c0eaf5', badge: '#55BBDD', badgeText: '#fff' },
  dragon:   { bg: '#F0EDFF', border: '#ccc5f5', badge: '#7766EE', badgeText: '#fff' },
  dark:     { bg: '#F0ECEA', border: '#d5ccc5', badge: '#775544', badgeText: '#fff' },
  fairy:    { bg: '#FFF0FF', border: '#f0c0f0', badge: '#EE77EE', badgeText: '#fff' },
  normal:   { bg: '#F5F5F5', border: '#e0e0e0', badge: '#AAAA99', badgeText: '#fff' },
  fighting: { bg: '#FFF0EE', border: '#f5c5c0', badge: '#CC4433', badgeText: '#fff' },
  flying:   { bg: '#F0F2FF', border: '#c5ccf5', badge: '#7788EE', badgeText: '#fff' },
  poison:   { bg: '#F7EDFF', border: '#ddc5f5', badge: '#AA55BB', badgeText: '#fff' },
  ground:   { bg: '#FFFAED', border: '#f5e5b0', badge: '#DDAA33', badgeText: '#fff' },
  rock:     { bg: '#F7F5ED', border: '#e0dbc5', badge: '#BBAA66', badgeText: '#fff' },
  bug:      { bg: '#F5FFED', border: '#d0f0b0', badge: '#88BB22', badgeText: '#fff' },
  ghost:    { bg: '#EDEDFF', border: '#c5c5f5', badge: '#5555BB', badgeText: '#fff' },
  steel:    { bg: '#F0F0F5', border: '#d0d0e0', badge: '#AAAABB', badgeText: '#fff' },
};

export const DEFAULT_TYPE_STYLE = { bg: '#F5F5F5', border: '#e0e0e0', badge: '#AAAA99', badgeText: '#fff' };

export const getTypeStyle = (type: string) => TYPE_STYLES[type] ?? DEFAULT_TYPE_STYLE;