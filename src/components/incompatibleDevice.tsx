import { Smartphone } from "lucide-react"
import styled from "styled-components"

export const IncompatibleDevice = () => {
  return (
    <Container>
      <Card>
        <IconWrapper>
          <Smartphone size={56} />
        </IconWrapper>

        <Title>Mobile Devices Are Not Supported</Title>

        <Description>
          This application is designed for desktop use and is not compatible with mobile devices. Please open it on a desktop or laptop computer for
          the best experience.
        </Description>
      </Card>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100vw;
  height: 100vh;

  padding: 2rem;
`

const Card = styled.div`
  padding: 2rem;
  text-align: center;
`

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;

  margin-bottom: 1.5rem;
`

const Title = styled.h1`
  margin: 0 0 0.75rem;

  color: ${({ theme }) => theme.colors.primaryText};
  font-size: 1.6rem;
  font-weight: 700;
`

const Description = styled.p`
  margin: 0;

  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 1rem;
  line-height: 1.6;
`
