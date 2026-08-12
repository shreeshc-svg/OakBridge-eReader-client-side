import './Skeleton.scss';

interface SkeletonProps {
     width?: string | number;
     height?: string | number;
     borderRadius?: string | number;
     className?: string;
     style?: React.CSSProperties;
}

const Skeleton = ({
     width = '100%',
     height = '100%',
     borderRadius = '8px',
     className = '',
     style,
}: SkeletonProps) => {
     return (
          <div
               className={`skeleton ${className}`}
               style={{
                    width,
                    height,
                    borderRadius,
                    ...style,
               }}
          />
     );
};

export default Skeleton;
