import csv from 'fast-csv';
import Channel from './model/Channel';
import Programme from './model/Programme';

const validRows = [];
const invalidRows = [];

export default function (csvData) {
  const options = {
    trim: true,
    headers: true
  };

  return new Promise((resolve, reject) => {
    const onValidateRow = (row, next) => {
      let isRowValid = true;
      const programme = new Programme(row);

      programme.validate((err) => {
        if (err) {
          isRowValid = !isRowValid;
        }
        next(null, isRowValid);
      });
    };

    const onInvalidRow = (invalidRow, rowNumber) => {
      invalidRows.push({
        row: rowNumber,
        data: invalidRow
      });
    };

    const onData = (validRow) => {
      validRows.push(validRow);
    };

    const onEnd = () => {
      let errors = [];
      // errors = processErrors(validationErrors[iter]);
      errors = invalidRows.map(row => ({ row: row.rowNumber, data: row.data }));

      if (errors.length) {
        return reject(errors);
      }
      return resolve(validRows);
    };

    const onTransform = (row, next) => {
      const findChannel = Channel.findOne({ code: row.channelCode }).exec();
      delete row.channelCode;

      // TODO: Perhaps pass in array of channels as a paremater from controller.
      findChannel.then((channel) => {
        // TODO: ^^^
        // if (!channel) {
        //   return next();
        // }
        row.channel = channel.id;
        next(null, row);
      }, next);
    };

    csv
      .fromStream(csvData, options)
      .transform(onTransform)
      .validate(onValidateRow)
      .on('data-invalid', onInvalidRow)
      .on('data', onData)
      .on('end', onEnd);
  });
}
