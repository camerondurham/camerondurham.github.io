'use client'

import Script from 'next/script'

export default function Analytics() {
  return (
    <Script
      data-goatcounter="https://u64cam.goatcounter.com/count"
      async
      src="//gc.zgo.at/count.js"
      strategy="afterInteractive"
    />
  )
}
