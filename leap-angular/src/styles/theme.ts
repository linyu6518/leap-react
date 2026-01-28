import { ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  token: {
    // TD Green Primary Color
    colorPrimary: '#00843D',
    colorSuccess: '#4CAF50',
    colorWarning: '#FFC107',
    colorError: '#E53935',
    colorInfo: '#1976D2',

    // Typography
    fontFamily: "'Graphik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 16,

    // Border
    borderRadius: 4,
    colorBorder: '#E0E0E0',

    // Background
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F5F5',
    colorBgElevated: '#FFFFFF',
  },
  components: {
    Button: {
      primaryColor: '#FFFFFF',
      controlHeight: 40,
      paddingContentHorizontal: 24,
      borderRadius: 0, // All buttons are square (no rounded corners)
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
      lineHeight: 1.5,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 4,
      colorText: '#1A1A1A',
      colorTextPlaceholder: '#757575',
      colorBorder: '#E0E0E0',
      activeBorderColor: '#00843D',
      hoverBorderColor: '#00843D',
      fontSize: 16,
      lineHeight: 1.5,
      // Customize arrow icon size
      optionSelectedBg: 'rgba(0, 132, 61, 0.1)',
      optionSelectedColor: '#00843D',
    },
    Form: {
      labelColor: '#1A1A1A',
      labelFontSize: 14,
      labelHeight: 20,
      labelRequiredMarkColor: '#E53935',
      itemMarginBottom: 20,
      verticalLabelPadding: '0 0 4px',
    },
    Table: {
      headerBg: '#FAFAFA',
      headerColor: '#1A1A1A',
      rowHoverBg: '#F5F5F5',
    },
    Menu: {
      itemSelectedBg: 'rgba(0, 132, 61, 0.3)',
      itemSelectedColor: '#00843D',
      itemHoverBg: 'rgba(255, 255, 255, 0.1)',
      itemActiveBg: 'rgba(0, 132, 61, 0.3)',
    },
    Layout: {
      siderBg: '#005A29',
      headerBg: '#FFFFFF',
      bodyBg: '#F5F5F5',
    },
    Tag: {
      borderRadius: 12,
      fontSize: 12,
    } as any,
    Drawer: {
      padding: 24,
    },
    Alert: {
      errorBg: '#F8E7E8',
      errorBorderColor: 'transparent',
      fontSize: 13,
      fontWeight: 600,
    } as any,
    Card: {
      borderRadius: 0, // Remove border radius
    } as any,
  },
}
