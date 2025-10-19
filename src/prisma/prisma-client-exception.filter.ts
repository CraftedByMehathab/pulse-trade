import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { Prisma } from 'generated/prisma';

const PrismaClientExceptionCodeToHTTPStatusCodeMap: {
  [key: Prisma.PrismaClientKnownRequestError['code']]: HttpStatus;
} = {
  P2001: HttpStatus.NOT_FOUND, // Record not found (conditional)
  P2002: HttpStatus.CONFLICT, // Unique constraint failed
  P2003: HttpStatus.BAD_REQUEST, // Foreign key constraint failed
  P2004: HttpStatus.BAD_REQUEST, // Constraint failed
  P2005: HttpStatus.BAD_REQUEST, // Invalid value for a field
  P2006: HttpStatus.BAD_REQUEST, // Invalid data provided
  P2007: HttpStatus.BAD_REQUEST, // Data validation error
  P2008: HttpStatus.INTERNAL_SERVER_ERROR, // Query parsing error
  P2009: HttpStatus.INTERNAL_SERVER_ERROR, // Query validation error
  P2010: HttpStatus.INTERNAL_SERVER_ERROR, // Raw query failed
  P2011: HttpStatus.BAD_REQUEST, // Null constraint violation
  P2012: HttpStatus.BAD_REQUEST, // Missing required field
  P2013: HttpStatus.BAD_REQUEST, // Missing required argument
  P2014: HttpStatus.BAD_REQUEST, // Relation violation
  P2015: HttpStatus.NOT_FOUND, // Related record not found
  P2016: HttpStatus.INTERNAL_SERVER_ERROR, // Query interpretation error
  P2017: HttpStatus.BAD_REQUEST, // Relation records not connected
  P2018: HttpStatus.NOT_FOUND, // Required record not found
  P2019: HttpStatus.BAD_REQUEST, // Input error (constraint)
  P2020: HttpStatus.BAD_REQUEST, // Value out of range
  P2021: HttpStatus.NOT_FOUND, // Table not found
  P2022: HttpStatus.NOT_FOUND, // Column not found
  P2023: HttpStatus.BAD_REQUEST, // Invalid table/column metadata
  P2024: HttpStatus.REQUEST_TIMEOUT, // Transaction timeout
  P2025: HttpStatus.NOT_FOUND, // Record not found for update/delete
  P2026: HttpStatus.BAD_REQUEST, // Invalid value for field
  P2027: HttpStatus.INTERNAL_SERVER_ERROR, // Multiple errors on query execution
  P2028: HttpStatus.INTERNAL_SERVER_ERROR, // Transaction API error
  P2030: HttpStatus.INTERNAL_SERVER_ERROR, // Query engine connection error
  P2031: HttpStatus.INTERNAL_SERVER_ERROR, // Missing full-text search index
  P2033: HttpStatus.BAD_REQUEST, // Missing argument for relation
  P2034: HttpStatus.INTERNAL_SERVER_ERROR, // Transaction conflict or retry needed
  P2035: HttpStatus.INTERNAL_SERVER_ERROR, // Migration-related error
  P2036: HttpStatus.INTERNAL_SERVER_ERROR, // Unknown engine panic
} as const;

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    console.log(exception.message);

    // const message = exception.message.replace(/\n/g, '');

    const statusCode =
      PrismaClientExceptionCodeToHTTPStatusCodeMap[exception.code];

    if (statusCode)
      host.switchToHttp().getResponse<Response>().status(statusCode).json({
        statusCode,
        timestamp: new Date().toISOString(),
        errorCode: exception.code,
      });
    else super.catch(exception, host);
  }
}
