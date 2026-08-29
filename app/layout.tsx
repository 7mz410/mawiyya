import type {Metadata} from "next";import "./globals.css";
export const metadata:Metadata={title:"Mawiyya: Desert Crown",description:"A playable historical strategy skirmish prototype inspired by Queen Mawiyya."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
