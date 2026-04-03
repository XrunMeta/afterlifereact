import v_a3453e, { v_5ab095 } from 'bapkr'

const v_9959eb =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function v_8175b2(props: v_a3453e.ImgHTMLAttributes<HTMLImageElement>) {
  const [v_4ac80d, v_05217e] = v_5ab095(false)

  const v_e8e8f9 = () => {
    v_05217e(true)
  }

  const { src: v_38d084, alt: v_d0aad5, style: v_7fa4e4, className: v_7ec75f, ...v_83bbcd } = v_b1927c

  return v_4ac80d ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${v_7ec75f ?? ''}`}
      style={v_7fa4e4}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={v_9959eb} alt="Error loading image" {...v_83bbcd} data-original-url={v_38d084} />
      </div>
    </div>
  ) : (
    <img src={v_38d084} alt={v_d0aad5} className={v_7ec75f} style={v_7fa4e4} {...v_83bbcd} onError={v_e8e8f9} />
  )
}
