import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  backgroundColor: string;
  textColor: string;
  href?: string;
}

export const Button = ({
  backgroundColor,
  textColor,
  children,
  className = "",
  style,
  href,
  ...props
}: ButtonProps) => {
  const classes = `
        px-8 py-3
        rounded-2xl
        font-bold
        text-xl
        shadow-lg
        transition-all
        duration-200
        hover:scale-105
        hover:brightness-110
        active:scale-95
        active:brightness-90
        cursor-pointer
        ${className}
      `;

  const styles = {
    backgroundColor,
    color: textColor,
    ...style,
  };

  if (href) {
    return (
      <Link href={href} className={classes} style={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} style={styles} {...props}>
      {children}
    </button>
  );
};
