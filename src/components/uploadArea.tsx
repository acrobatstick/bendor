import { forwardRef, useCallback, useRef, useState } from "react"
import styled from "styled-components"

interface IUploadArea extends React.InputHTMLAttributes<HTMLInputElement> {}

const UploadArea = forwardRef<HTMLInputElement, IUploadArea>(({ onChange, ...rest }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleBrowseClick = () => {
    if (ref && "current" in ref && ref.current) {
      ref.current.click()
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const processFile = useCallback(
    (file: File) => {
      if (ref && "current" in ref && ref.current) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        ref.current.files = dataTransfer.files

        if (onChange) {
          const event = new Event("change", { bubbles: true })
          Object.defineProperty(event, "target", {
            writable: false,
            value: ref.current
          })
          onChange(event as any)
        }
      }
    },
    [ref, onChange]
  )

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0 && ref && "current" in ref && ref.current) {
      processFile(files[0])
    }
  }

  return (
    <Container ref={containerRef}>
      <DragArea
        className={isDragging ? "active" : ""}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <Icon>
          <i className="fas fa-images"></i>
        </Icon>
        <Header>Drag & Drop</Header>
        <Header>
          or <Browse>browse</Browse>
        </Header>
        <HiddenInput ref={ref} type="file" accept="image/*" onChange={onChange} {...rest} />
        <Support>Supports: JPEG, JPG, PNG</Support>
      </DragArea>
    </Container>
  )
})

const Container = styled.div`
  max-width: 650px;
  width: 100%;
  padding: 30px;
  background: #fff;
`

const DragArea = styled.div`
  cursor: pointer;
  height: 400px;
  border: 1px dashed #9da2ac;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 10px auto;

  &.active {
    border: 1px solid ${({ theme }) => theme.colors.primary};
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const Icon = styled.div`
  font-size: 50px;
  color: ${({ theme }) => theme.colors.primary};
`

const Header = styled.span`
  font-size: 20px;
  font-weight: 500;
  color: #34495e;
`

const Support = styled.span`
  font-size: 12px;
  color: gray;
  margin: 10px 0 15px 0;
`

const Browse = styled.span`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
`

const HiddenInput = styled.input`
  display: none;
`

export default UploadArea
