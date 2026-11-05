// Internal page-level art comparison; never written to player saves.
const requested = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('liquid')
export const LIQUID_FINISH = requested === 'legacy' || requested === 'polished' || requested === 'unified' || requested === 'clean' || requested === 'gem-luster' || requested === 'soft-translucent' ? requested : 'vivid-translucent'
export const EQUAL_HEIGHT_LIQUID = LIQUID_FINISH === 'clean' || LIQUID_FINISH === 'soft-translucent' || LIQUID_FINISH === 'gem-luster' || LIQUID_FINISH === 'vivid-translucent'


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
export const CLEAN_COLORS = [
  { name: '玫瑰红', light: '#e88aa8', main: '#ce4778', dark: '#a6345c' },
  { name: '紫水晶', light: '#be91e8', main: '#9858d2', dark: '#743cae' },
  { name: '薄荷绿', light: '#86d5b7', main: '#43b99b', dark: '#2b917c' },
  { name: '天空蓝', light: '#7ec8ed', main: '#399bd9', dark: '#287db8' },
  { name: '蜂蜜金', light: '#f2cd7b', main: '#e3a83d', dark: '#c28b29' },
  { name: '珊瑚橙', light: '#f4b98e', main: '#eb915c', dark: '#cd7048' },
  { name: '兰花粉', light: '#e8a2df', main: '#d174cd', dark: '#ad56b0' },
] as const
// Brighter chromatic inputs compensate for real background transmission, rather
// than covering the liquid with an opaque or milky optical underpaint.
export const VIVID_COLORS = [
  { name: '玫瑰红', light: '#ff9fbe', main: '#f35d93', dark: '#c13d6b' },
  { name: '紫水晶', light: '#d1a0ff', main: '#af62ff', dark: '#843cbe' },
  { name: '薄荷绿', light: '#9aefd3', main: '#51dcb6', dark: '#2caa8e' },
  { name: '天空蓝', light: '#9adbff', main: '#30c3ff', dark: '#258ecb' },
  { name: '蜂蜜金', light: '#ffe798', main: '#ffd04a', dark: '#d6a332' },
  { name: '珊瑚橙', light: '#ffd0a0', main: '#ffb361', dark: '#dc8046' },
  { name: '兰花粉', light: '#ffc2fb', main: '#f18af8', dark: '#bf5abb' },
] as const
export const COLORS = LIQUID_FINISH === 'legacy' ? LEGACY_COLORS : LIQUID_FINISH === 'vivid-translucent' ? VIVID_COLORS : EQUAL_HEIGHT_LIQUID ? CLEAN_COLORS : POLISHED_COLORS
