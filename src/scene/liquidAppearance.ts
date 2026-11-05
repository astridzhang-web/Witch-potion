// Internal page-level art comparison; never written to player saves.
export const LIQUID_FINISH = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('liquid') === 'legacy' ? 'legacy' : 'polished'

export const LEGACY_COLORS = [
  { name: '玫瑰红', light: '#dc8b9d', main: '#c25b79', dark: '#a54d68' },
  { name: '紫水晶', light: '#b8a0dc', main: '#9774c4', dark: '#795ba3' },
  { name: '薄荷绿', light: '#9cd4bc', main: '#68b99e', dark: '#48927d' },
  { name: '天空蓝', light: '#a5cede', main: '#6eafd0', dark: '#548aa9' },
  { name: '蜂蜜金', light: '#ead39b', main: '#d6b56b', dark: '#b09350' },
  { name: '珊瑚橙', light: '#edb79a', main: '#df986f', dark: '#b87857' },
  { name: '兰花粉', light: '#e0b2dd', main: '#ca8bc7', dark: '#a367a2' },
] as const
export const POLISHED_COLORS = [
  { name: '玫瑰红', light: '#e28da9', main: '#c94f7b', dark: '#9d3b62' },
  { name: '紫水晶', light: '#bd98e4', main: '#9963cd', dark: '#7445a7' },
  { name: '薄荷绿', light: '#8ed1b8', main: '#50b59b', dark: '#378d80' },
  { name: '天空蓝', light: '#88c7e5', main: '#4b9cd3', dark: '#3479b0' },
  { name: '蜂蜜金', light: '#f0ce86', main: '#dfac4d', dark: '#bc8735' },
  { name: '珊瑚橙', light: '#f1bd96', main: '#e89868', dark: '#c67751' },
  { name: '兰花粉', light: '#e5abdc', main: '#cd7fc8', dark: '#a85fae' },
] as const
export const COLORS = LIQUID_FINISH === 'legacy' ? LEGACY_COLORS : POLISHED_COLORS
