import React from 'react'
import styles from './NumericalInput.module.scss'

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`)

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const Input = React.memo(function InnerInput({
  value,
  onChange,
  placeholder,
  fontSize,
  color,
  fontWeight,
  align,
  ...rest
}: {
  value: string | number
  onChange: (input: string) => void
  error?: boolean
  fontSize?: number
  fontWeight?: string | number
  align?: 'right' | 'left'
} & any) {
  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onChange && onChange(nextUserInput)
    }
  }

  return (
    <input
      {...rest}
      className={styles.styledInput}
      value={value}
      style={{ textAlign: align, color, fontSize, fontWeight }}
      onChange={(event) => {
        // replace commas with periods, because uniswap exclusively uses period as the decimal separator
        enforcer(event.target.value.replace(/,/g, '.'))
      }}
      // universal input options
      inputMode='decimal'
      autoComplete='off'
      autoCorrect='off'
      // text-specific options
      type='text'
      pattern='^[0-9]*[.,]?[0-9]*$'
      placeholder={placeholder || '0.0'}
      minLength={1}
      maxLength={79}
      spellCheck='false'
    />
  )
})

export default Input
