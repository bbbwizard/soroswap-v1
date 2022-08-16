import { PropsWithChildren } from 'react'
import Footer from '../Footer/Footer'
import Navbar from '../Navbar/Navbar'
import { Box } from '@material-ui/core'
import styles from './Layout.module.scss'

export default function Layout({ children }: PropsWithChildren<{}>) {
  return (
    <Box className={`${styles.page}`}>
      <Navbar />
      <Box className='pageWrapper'>{children}</Box>
      <Footer />
    </Box>
  )
}
