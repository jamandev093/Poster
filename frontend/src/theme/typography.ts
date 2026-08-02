const Typography = {
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700" as const,
  },

  headline: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },

  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },

  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },

  small: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500" as const,
  },

  display: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "800" as const,
  },

  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700" as const,
  },
} as const;

export default Typography;