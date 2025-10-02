"use client";

/**
 * @author: @dorian_baffier
 * @description: Shimmer Text
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface ShimmerTextProps {
    text: string;
    className?: string;
}

export default function ShimmerText({
    text = "Text Shimmer",
    className,
}: ShimmerTextProps) {
    return (
        <motion.span
            className={cn(
                "inline-block bg-gradient-to-r from-neutral-950 via-neutral-400 to-neutral-950 dark:from-white dark:via-neutral-600 dark:to-white bg-[length:200%_100%] bg-clip-text text-transparent",
                className
            )}
            animate={{
                backgroundPosition: ["200% center", "-200% center"],
            }}
            transition={{
                duration: 2.5,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
            }}
        >
            {text}
        </motion.span>
    );
}
