import type { ThemeConfig } from 'antd'

/** LEAP UI Ant Design theme (TD brand). Use with <ConfigProvider theme={leapTheme}> */
export const leapTheme: ThemeConfig = {
  token: {
    colorPrimary: '#00843D',
    colorSuccess: '#4CAF50',
    colorWarning: '#FFC107',
    colorError: '#E53935',
    colorInfo: '#1976D2',
    fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 16,
    borderRadius: 4,
    colorBorder: '#E0E0E0',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F5F5',
  },
  components: {
    Button: {
      controlHeight: 40,
      paddingContentHorizontal: 24,
      borderRadius: 0,
      fontWeight: 500,
    } as any,
    Input: {
      controlHeight: 54,
      borderRadius: 0,
      colorText: '#1A1A1A',
      colorTextPlaceholder: '#1C1C1C',
      colorBorder: '#8B8B8B',
      activeBorderColor: '#008A00',
      hoverBorderColor: '#008A00',
      fontSize: 16,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 4,
      colorText: '#1A1A1A',
      colorBorder: '#E0E0E0',
      activeBorderColor: '#00843D',
      hoverBorderColor: '#00843D',
      fontSize: 16,
      optionSelectedBg: 'rgba(0, 132, 61, 0.1)',
      optionSelectedColor: '#00843D',
    },
    Tag: { borderRadius: 12, fontSize: 12 } as any,
  },
}

export default leapTheme
