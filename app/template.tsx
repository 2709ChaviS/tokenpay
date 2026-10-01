import { RecoveryRedirect } from '@/components/recovery-redirect'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RecoveryRedirect />
      {children}
    </>
  )
}